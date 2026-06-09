package com.tuplastic.erp.order.service;

import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.BusinessLogicException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.order.dto.DeliverBatchRequest;
import com.tuplastic.erp.order.dto.OrderFulfillmentSummaryDto;
import com.tuplastic.erp.order.dto.OrderResponse;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.entity.OrderItem;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.mapper.OrderMapper;
import com.tuplastic.erp.order.repository.OrderItemRepository;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.product.repository.ProductRepository;
import com.tuplastic.erp.production.entity.ProductionTask;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.productinventory.entity.ProductInventoryLog;
import com.tuplastic.erp.productinventory.repository.ProductInventoryLogRepository;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderDeliveryService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductionTaskRepository productionTaskRepository;
    private final ProductRepository productRepository;
    private final ProductInventoryLogRepository productInventoryLogRepository;
    private final AgencyRepository agencyRepository;
    private final OrderMapper orderMapper;
    private final OrderFulfillmentService orderFulfillmentService;

    @Transactional(readOnly = true)
    public OrderFulfillmentSummaryDto getFulfillmentSummary(UUID orderId, User seller) {
        findSellerOrderOrThrow(orderId, seller);
        return orderFulfillmentService.buildSummary(orderId);
    }

    @Transactional
    public OrderResponse deliverBatch(UUID orderId, DeliverBatchRequest request, User seller) {
        if (request == null || request.getTaskId() == null) {
            throw new BadRequestException("taskId không được để trống.");
        }
        String deliveryAddress = request.getDeliveryAddress() != null ? request.getDeliveryAddress().trim() : "";
        if (deliveryAddress.isEmpty()) {
            throw new BadRequestException("Địa chỉ giao không được để trống.");
        }
        String proofUrl = request.getDeliveryProofImageUrl() != null
                ? request.getDeliveryProofImageUrl().trim()
                : "";
        if (proofUrl.isEmpty()) {
            throw new BadRequestException("Ảnh bằng chứng giao hàng không được để trống.");
        }

        UUID taskId = request.getTaskId();
        Order order = findSellerOrderOrThrow(orderId, seller);
        assertStatus(order, OrderStatus.Producing, "giao từng đợt");

        ProductionTask task = productionTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Lệnh sản xuất", "id", taskId));

        if (task.getOrder() == null || !task.getOrder().getId().equals(orderId)) {
            throw new BadRequestException("Lệnh sản xuất không thuộc đơn hàng này.");
        }
        if (!"Done".equals(task.getStatus())) {
            throw new BadRequestException(
                    String.format("Chỉ giao lô đã hoàn thành SX. Trạng thái hiện tại: %s", task.getStatus()));
        }
        if (task.getDeliveredAt() != null) {
            throw new BadRequestException("Lô này đã được giao trước đó.");
        }

        OrderItem orderItem = task.getOrderItem();
        if (orderItem == null) {
            throw new BadRequestException("Lệnh sản xuất không gắn dòng đơn — không thể giao.");
        }

        Product product = task.getProduct();
        if (product == null) {
            throw new BadRequestException("Lệnh sản xuất không gắn sản phẩm.");
        }

        if (product.getStockQuantity() < task.getQuantity()) {
            throw new BusinessLogicException(
                    String.format("Tồn kho không đủ để giao lô '%s' (SKU: %s). Cần: %d, Có: %d",
                            product.getName(), product.getSku(),
                            task.getQuantity(), product.getStockQuantity()));
        }

        product.setStockQuantity(product.getStockQuantity() - task.getQuantity());
        productRepository.save(product);

        ProductInventoryLog log = ProductInventoryLog.builder()
                .product(product)
                .order(order)
                .task(task)
                .createdBy(seller)
                .transactionType("EXPORT")
                .quantityChange(-task.getQuantity())
                .note("Giao đợt MTO - Lệnh SX #" + task.getId().toString().substring(0, 8)
                        + " · " + truncateForLog(deliveryAddress, 120))
                .build();
        productInventoryLogRepository.save(log);

        int newDelivered = (orderItem.getDeliveredQuantity() != null ? orderItem.getDeliveredQuantity() : 0)
                + task.getQuantity();
        if (newDelivered > orderItem.getQuantity()) {
            throw new BusinessLogicException("Giao vượt số lượng đặt trên dòng đơn.");
        }
        orderItem.setDeliveredQuantity(newDelivered);
        orderItemRepository.save(orderItem);

        task.setDeliveryAddress(deliveryAddress);
        task.setDeliveryProofImageUrl(proofUrl);
        task.setDeliveredAt(LocalDateTime.now());
        productionTaskRepository.save(task);

        return orderMapper.toResponse(order);
    }

    private static String truncateForLog(String text, int maxLen) {
        if (text == null || text.length() <= maxLen) {
            return text;
        }
        return text.substring(0, maxLen - 1) + "…";
    }

    @Transactional
    public OrderResponse markDone(UUID orderId, User seller) {
        Order order = findSellerOrderOrThrow(orderId, seller);
        assertStatus(order, OrderStatus.Producing, "xác nhận hoàn tất đơn");

        List<ProductionTask> tasks = productionTaskRepository.findByOrder_IdOrderByCreatedAtAsc(order.getId());
        if (tasks.isEmpty()) {
            throw new BadRequestException(
                    "Đơn chưa có lô sản xuất. Tạo lô, hoàn tất SX và giao từng đợt trước khi chốt đơn.");
        }

        for (ProductionTask t : tasks) {
            if ("Waiting".equals(t.getStatus()) || "Doing".equals(t.getStatus())) {
                throw new BusinessLogicException(
                        String.format("Còn lô SX chưa hoàn thành (trạng thái: %s).", t.getStatus()));
            }
            if (!"Done".equals(t.getStatus())) {
                throw new BusinessLogicException(
                        String.format("Lô SX có trạng thái không hợp lệ: %s", t.getStatus()));
            }
            if (t.getDeliveredAt() == null) {
                throw new BusinessLogicException(
                        "Còn lô SX đã hoàn thành nhưng chưa giao. Dùng deliver-batch trước khi chốt đơn.");
            }
        }

        List<OrderItem> items = orderItemRepository.findByOrderIdOrderByCreatedAtAsc(order.getId());
        for (OrderItem item : items) {
            int delivered = item.getDeliveredQuantity() != null ? item.getDeliveredQuantity() : 0;
            if (delivered < item.getQuantity()) {
                throw new BusinessLogicException(
                        String.format("Chưa giao đủ '%s'. Đã giao: %d / %d.",
                                item.getProduct().getName(), delivered, item.getQuantity()));
            }
            int batched = productionTaskRepository.sumQuantityByOrderItemId(item.getId());
            if (batched < item.getQuantity()) {
                throw new BusinessLogicException(
                        String.format("Chưa lập đủ lô SX cho '%s'. Đã lập lô: %d / %d.",
                                item.getProduct().getName(), batched, item.getQuantity()));
            }
        }

        Agency agency = order.getAgency();
        agency.setTotalDebt(agency.getTotalDebt().add(orderUnpaidBalance(order)));
        agencyRepository.save(agency);

        order.setStatus(OrderStatus.Done);
        return orderMapper.toResponse(orderRepository.save(order));
    }

    private static BigDecimal orderUnpaidBalance(Order order) {
        BigDecimal unpaid = order.getTotalPayable().subtract(order.getPaidAmount());
        return unpaid.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : unpaid;
    }

    private Order findSellerOrderOrThrow(UUID orderId, User seller) {
        return orderRepository.findByIdAndCreatedById(orderId, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
    }

    private void assertStatus(Order order, OrderStatus expected, String action) {
        if (order.getStatus() != expected) {
            throw new BadRequestException(
                    String.format("Không thể %s: đơn hàng đang ở trạng thái '%s', yêu cầu '%s'",
                            action, order.getStatus(), expected));
        }
    }
}
