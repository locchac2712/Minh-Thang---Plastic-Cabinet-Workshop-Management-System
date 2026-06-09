package com.tuplastic.erp.production.service;

import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.entity.OrderItem;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.repository.OrderItemRepository;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.production.dto.CreateProductionBatchRequest;
import com.tuplastic.erp.production.dto.ProductionOrderBatchesResponse;
import com.tuplastic.erp.production.dto.TaskResponse;
import com.tuplastic.erp.production.entity.ProductionTask;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.production.util.ProductionTaskDisplayCodeUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductionBatchService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductionTaskRepository productionTaskRepository;
    private final ProductionTaskService productionTaskService;

    @Transactional
    public TaskResponse createBatch(UUID orderId, CreateProductionBatchRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        if (order.getStatus() != OrderStatus.Producing) {
            throw new BadRequestException(
                    String.format("Chỉ tạo lô khi đơn ở trạng thái Producing. Hiện tại: %s", order.getStatus()));
        }
        if (order.getSourceOrder() == null) {
            throw new BadRequestException("Chỉ lập lô cho đơn fulfillment (DH), không phải báo giá (BG).");
        }

        OrderItem orderItem = orderItemRepository.findById(request.getOrderItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Dòng đơn", "id", request.getOrderItemId()));

        if (!orderItem.getOrder().getId().equals(orderId)) {
            throw new BadRequestException("Dòng đơn không thuộc đơn hàng này.");
        }

        int batched = productionTaskRepository.sumQuantityByOrderItemId(orderItem.getId());
        int remaining = orderItem.getQuantity() - batched;
        if (request.getQuantity() > remaining) {
            throw new BadRequestException(
                    String.format("Số lượng lô vượt phần còn lại. Còn có thể lập lô: %d, yêu cầu: %d",
                            remaining, request.getQuantity()));
        }

        LocalDate endDate = request.getExpectedEndDate();
        LocalDate today = LocalDate.now();
        if (endDate.isBefore(today)) {
            throw new BadRequestException("Hạn lô không được ở quá khứ.");
        }
        LocalDate deliveryDate = order.getExpectedDeliveryDate();
        if (deliveryDate != null && endDate.isAfter(deliveryDate)) {
            throw new BadRequestException(
                    String.format("Hạn lô (%s) không được sau ngày giao dự kiến (%s).", endDate, deliveryDate));
        }

        ProductionTask task = ProductionTask.builder()
                .displayCode(ProductionTaskDisplayCodeUtils.allocateDisplayCode(productionTaskRepository))
                .order(order)
                .orderItem(orderItem)
                .product(orderItem.getProduct())
                .quantity(request.getQuantity())
                .expectedEndDate(endDate)
                .status("Waiting")
                .build();

        ProductionTask saved = productionTaskRepository.save(task);
        return productionTaskService.toTaskResponse(saved);
    }

    @Transactional(readOnly = true)
    public ProductionOrderBatchesResponse listBatchesByOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        List<TaskResponse> batches = productionTaskRepository.findByOrder_IdOrderByCreatedAtAsc(orderId).stream()
                .map(productionTaskService::toTaskResponse)
                .toList();

        List<OrderItem> items = orderItemRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
        List<ProductionOrderBatchesResponse.OrderItemBatchRemainingDto> remaining = items.stream()
                .map(this::toRemainingDto)
                .toList();

        return ProductionOrderBatchesResponse.builder()
                .orderId(orderId)
                .expectedDeliveryDate(order.getExpectedDeliveryDate())
                .batches(batches)
                .remainingByItem(remaining)
                .build();
    }

    private ProductionOrderBatchesResponse.OrderItemBatchRemainingDto toRemainingDto(OrderItem item) {
        int batched = productionTaskRepository.sumQuantityByOrderItemId(item.getId());
        return ProductionOrderBatchesResponse.OrderItemBatchRemainingDto.builder()
                .orderItemId(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .orderedQuantity(item.getQuantity())
                .batchedQuantity(batched)
                .remainingBatchable(item.getQuantity() - batched)
                .build();
    }
}
