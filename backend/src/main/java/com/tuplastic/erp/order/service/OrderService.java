package com.tuplastic.erp.order.service;

import com.tuplastic.erp.activitylog.repository.ActivityLogRepository;
import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.BusinessLogicException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.order.dto.*;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.entity.OrderItem;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.mapper.OrderMapper;
import com.tuplastic.erp.invoice.repository.InvoiceRepository;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.product.repository.ProductRepository;
import com.tuplastic.erp.production.entity.ProductionTask;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.productinventory.entity.ProductInventoryLog;
import com.tuplastic.erp.productinventory.repository.ProductInventoryLogRepository;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final AgencyRepository agencyRepository;
    private final ProductRepository productRepository;
    private final ProductionTaskRepository productionTaskRepository;
    private final ProductInventoryLogRepository productInventoryLogRepository;
    private final InvoiceRepository invoiceRepository;
    private final ActivityLogRepository activityLogRepository;
    private final OrderMapper orderMapper;

    @Transactional(readOnly = true)
    public OrderResponse getSellerOrderDetail(UUID orderId, User seller) {
        Order order = findSellerOrderOrThrow(orderId, seller);
        return orderMapper.toResponse(order);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getSellerOrders(User seller, List<OrderStatus> statuses,
                                                        int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orderPage = orderRepository.findBySellerWithFilters(seller.getId(), statuses, pageable);
        return toPageResponse(orderPage);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAgencyOrders(UUID agencyId, User seller,
                                                        List<OrderStatus> statuses,
                                                        int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orderPage = orderRepository.findByAgencyAndSeller(agencyId, seller.getId(), statuses, pageable);
        return toPageResponse(orderPage);
    }

    /**
     * Danh sách đơn dưới góc nhìn “báo giá”: cùng phân trang/lọc như {@link #getSellerOrders},
     * nhưng query param {@code status} dùng ô gộp {@code Draft|Pending|Approved|Rejected}
     * (Approved = đơn đã chốt và sau đó: Approved, Producing, Done, Canceled).
     */
    @Transactional(readOnly = true)
    public PageResponse<QuotationOrderResponse> getSellerQuotations(User seller, List<OrderStatus> statusesFilter,
                                                                   int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orderPage = orderRepository.findBySellerWithFilters(seller.getId(), statusesFilter, pageable);
        return toQuotationPageResponse(orderPage);
    }

    @Transactional(readOnly = true)
    public QuotationOrderResponse getSellerQuotationDetail(UUID orderId, User seller) {
        return toQuotationResponse(findSellerOrderOrThrow(orderId, seller));
    }

    /**
     * Lọc theo ô báo giá (có thể nối bằng dấu phẩy = OR), map sang danh sách {@link OrderStatus} để query.
     */
    public List<OrderStatus> parseQuotationStatuses(String statusParam) {
        if (statusParam == null || statusParam.isBlank()) {
            return null;
        }
        EnumSet<OrderStatus> acc = EnumSet.noneOf(OrderStatus.class);
        for (String part : statusParam.split(",")) {
            String s = part.trim();
            if (s.isEmpty()) {
                continue;
            }
            acc.addAll(expandQuotationView(s));
        }
        return acc.isEmpty() ? null : new ArrayList<>(acc);
    }

    /** Một ô báo giá → các trạng thái đơn tương ứng. */
    private static EnumSet<OrderStatus> expandQuotationView(String view) {
        return switch (view) {
            case "Draft" -> EnumSet.of(OrderStatus.Draft);
            case "Pending" -> EnumSet.of(OrderStatus.Pending);
            case "Rejected" -> EnumSet.of(OrderStatus.Rejected);
            case "Approved" -> EnumSet.of(
                    OrderStatus.Approved, OrderStatus.Producing, OrderStatus.Done, OrderStatus.Canceled);
            default -> throw new BadRequestException(
                    "Trạng thái báo giá không hợp lệ: " + view
                            + ". Chấp nhận: Draft, Pending, Approved, Rejected");
        };
    }

    public static String quotationViewFromOrderStatus(OrderStatus status) {
        return switch (status) {
            case Draft -> "Draft";
            case Pending -> "Pending";
            case Rejected -> "Rejected";
            case Approved, Producing, Done, Canceled -> "Approved";
        };
    }

    private QuotationOrderResponse toQuotationResponse(Order order) {
        OrderResponse base = orderMapper.toResponse(order);
        QuotationOrderResponse q = new QuotationOrderResponse();
        BeanUtils.copyProperties(base, q);
        q.setQuotationStatus(quotationViewFromOrderStatus(order.getStatus()));
        return q;
    }

    private PageResponse<QuotationOrderResponse> toQuotationPageResponse(Page<Order> orderPage) {
        return PageResponse.<QuotationOrderResponse>builder()
                .content(orderPage.getContent().stream().map(this::toQuotationResponse).toList())
                .page(orderPage.getNumber())
                .size(orderPage.getSize())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .last(orderPage.isLast())
                .build();
    }

    @Transactional
    public OrderResponse createDraftOrder(CreateOrderRequest request, User seller) {
        Agency agency = agencyRepository.findByIdAndAssignedSellerId(request.getAgencyId(), seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Đại lý", "id", request.getAgencyId()));

        Order order = Order.builder()
                .agency(agency)
                .createdBy(seller)
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .shippingFee(request.getShippingFee() != null ? request.getShippingFee() : BigDecimal.ZERO)
                .shippingAddress(request.getShippingAddress())
                .note(request.getNote())
                .status(OrderStatus.Draft)
                .build();

        BigDecimal totalAmount = populateOrderLineItems(order, request.getItems());
        applyOrderMoneyFields(order, totalAmount);

        Order saved = orderRepository.save(order);
        return orderMapper.toResponse(saved);
    }

    /**
     * Chỉ đơn nháp (Draft). Ghi đè header + toàn bộ dòng hàng.
     */
    @Transactional
    public OrderResponse updateDraftOrder(UUID orderId, CreateOrderRequest request, User seller) {
        Order order = findSellerOrderOrThrow(orderId, seller);
        assertStatus(order, OrderStatus.Draft, "cập nhật đơn");

        Agency agency = agencyRepository.findByIdAndAssignedSellerId(request.getAgencyId(), seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Đại lý", "id", request.getAgencyId()));

        order.setAgency(agency);
        order.setDiscountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO);
        order.setShippingFee(request.getShippingFee() != null ? request.getShippingFee() : BigDecimal.ZERO);
        order.setShippingAddress(request.getShippingAddress());
        order.setNote(request.getNote());

        order.getItems().clear();
        BigDecimal totalAmount = populateOrderLineItems(order, request.getItems());
        applyOrderMoneyFields(order, totalAmount);

        return orderMapper.toResponse(orderRepository.save(order));
    }

    /** Thêm dòng vào {@code order.items} (danh sách entity phải rỗng hoặc caller đã clear). */
    private BigDecimal populateOrderLineItems(Order order, List<CreateOrderItemRequest> itemReqs) {
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CreateOrderItemRequest itemReq : itemReqs) {
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setQuantity(itemReq.getQuantity());
            item.setUnitPrice(itemReq.getUnitPrice());

            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm", "id", itemReq.getProductId()));

            if (Boolean.TRUE.equals(product.getIsCustom()) && product.getAgency() != null
                    && !product.getAgency().getId().equals(order.getAgency().getId())) {
                throw new BadRequestException(
                        "Sản phẩm thiết kế riêng '" + product.getName() + "' không thuộc đại lý của đơn này.");
            }

            item.setProduct(product);
            item.setUnitCostAtTime(product.getCostPrice());

            BigDecimal subtotal = itemReq.getUnitPrice()
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            item.setSubtotal(subtotal);
            totalAmount = totalAmount.add(subtotal);

            order.getItems().add(item);
        }
        return totalAmount;
    }

    private static void applyOrderMoneyFields(Order order, BigDecimal totalAmount) {
        order.setTotalAmount(totalAmount);
        order.setTotalPayable(
                totalAmount
                        .subtract(order.getDiscountAmount())
                        .add(order.getShippingFee()));
    }

    /**
     * Draft → Pending: Gửi đơn chờ duyệt. Kiểm tra hạn mức công nợ.
     */
    @Transactional
    public OrderResponse submitOrder(UUID orderId, User seller) {
        Order order = findSellerOrderOrThrow(orderId, seller);
        assertStatus(order, OrderStatus.Draft, "gửi duyệt");

        Agency agency = order.getAgency();
        BigDecimal thisOrderUnpaid = orderUnpaidBalance(order);
        BigDecimal projectedDebt = agency.getTotalDebt().add(thisOrderUnpaid);
        if (projectedDebt.compareTo(agency.getMaxDebtLimit()) > 0) {
            throw new BusinessLogicException(
                    String.format("Vượt hạn mức công nợ! Nợ hiện tại: %s + Phần chưa thu của đơn này: %s = %s > Trần nợ: %s. Liên hệ Giám đốc nâng hạn mức.",
                            agency.getTotalDebt().toPlainString(),
                            thisOrderUnpaid.toPlainString(),
                            projectedDebt.toPlainString(),
                            agency.getMaxDebtLimit().toPlainString()));
        }

        order.setStatus(OrderStatus.Pending);
        return orderMapper.toResponse(orderRepository.save(order));
    }

    /**
     * Approved → Producing: Ép lệnh xuống xưởng. Tại đây mới tạo {@link ProductionTask} (1 task / dòng đơn),
     * tránh xưởng thấy lệnh khi đơn chỉ mới được duyệt tài chính.
     */
    @Transactional
    public OrderResponse pushProduction(UUID orderId, User seller) {
        Order order = findSellerOrderOrThrow(orderId, seller);
        assertStatus(order, OrderStatus.Approved, "ép lệnh sản xuất");

        if (productionTaskRepository.findByOrder_IdOrderByCreatedAtAsc(order.getId()).isEmpty()) {
            createProductionTasks(order);
        }

        order.setStatus(OrderStatus.Producing);
        return orderMapper.toResponse(orderRepository.save(order));
    }

    /**
     * Draft → Done: Bán hàng có sẵn (mì ăn liền). Trừ kho thành phẩm.
     * Yêu cầu: tồn kho đủ cho từng dòng.
     */
    @Transactional
    public OrderResponse deliverInStock(UUID orderId, User seller) {
        Order order = findSellerOrderOrThrow(orderId, seller);
        assertStatus(order, OrderStatus.Draft, "xuất bán hàng có sẵn");

        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new BusinessLogicException(
                        String.format("Tồn kho không đủ cho '%s' (SKU: %s). Cần: %d, Có: %d",
                                product.getName(), product.getSku(),
                                item.getQuantity(), product.getStockQuantity()));
            }
        }

        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            productRepository.save(product);

            ProductInventoryLog log = ProductInventoryLog.builder()
                    .product(product)
                    .order(order)
                    .createdBy(seller)
                    .transactionType("EXPORT")
                    .quantityChange(-item.getQuantity())
                    .note("Xuất bán hàng có sẵn - Đơn #" + order.getId().toString().substring(0, 8))
                    .build();
            productInventoryLogRepository.save(log);
        }

        Agency agency = order.getAgency();
        agency.setTotalDebt(agency.getTotalDebt().add(orderUnpaidBalance(order)));
        agencyRepository.save(agency);

        order.setStatus(OrderStatus.Done);
        return orderMapper.toResponse(orderRepository.save(order));
    }

    /**
     * Producing → Done: Xác nhận giao hàng thành công. Yêu cầu mọi lệnh SX của đơn đã Done; xuất kho TP
     * (đối ứng lần nhập kho tại {@link com.tuplastic.erp.production.service.ProductionTaskService#completeTask}).
     */
    @Transactional
    public OrderResponse markDone(UUID orderId, User seller) {
        Order order = findSellerOrderOrThrow(orderId, seller);
        assertStatus(order, OrderStatus.Producing, "xác nhận giao hàng");

        List<ProductionTask> tasks = productionTaskRepository.findByOrder_IdOrderByCreatedAtAsc(order.getId());
        if (tasks.isEmpty()) {
            throw new BadRequestException(
                    "Đơn không có lệnh sản xuất. Dùng PATCH deliver-instock nếu giao từ kho, hoặc push-production trước.");
        }
        for (ProductionTask t : tasks) {
            if (!"Done".equals(t.getStatus())) {
                throw new BusinessLogicException(
                        String.format("Còn lệnh SX chưa hoàn thành (trạng thái hiện tại: %s). Hoàn tất mọi lệnh trước khi giao hàng.",
                                t.getStatus()));
            }
        }

        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new BusinessLogicException(
                        String.format("Tồn kho không đủ để xuất giao hàng cho '%s' (SKU: %s). Cần: %d, Có: %d",
                                product.getName(), product.getSku(),
                                item.getQuantity(), product.getStockQuantity()));
            }
        }

        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            productRepository.save(product);

            ProductInventoryLog log = ProductInventoryLog.builder()
                    .product(product)
                    .order(order)
                    .createdBy(seller)
                    .transactionType("EXPORT")
                    .quantityChange(-item.getQuantity())
                    .note("Xuất giao hàng MTO - Đơn #" + order.getId().toString().substring(0, 8))
                    .build();
            productInventoryLogRepository.save(log);
        }

        Agency agency = order.getAgency();
        agency.setTotalDebt(agency.getTotalDebt().add(orderUnpaidBalance(order)));
        agencyRepository.save(agency);

        order.setStatus(OrderStatus.Done);
        return orderMapper.toResponse(orderRepository.save(order));
    }

    /**
     * Hủy đơn (Canceled). Draft/Pending/Rejected: chỉ đổi trạng thái. Approved: xóa lệnh SX Waiting nếu có.
     * Producing: chỉ khi mọi lệnh SX còn Waiting. Done: nhập lại TP, trừ công nợ — không cho nếu đã thu tiền hoặc có hóa đơn Draft/Issued.
     */
    @Transactional
    public OrderResponse cancelOrder(UUID orderId, User seller) {
        Order order = findSellerOrderOrThrow(orderId, seller);
        if (order.getStatus() == OrderStatus.Canceled) {
            throw new BadRequestException("Đơn đã ở trạng thái Canceled.");
        }

        return switch (order.getStatus()) {
            case Draft, Pending, Rejected -> {
                order.setStatus(OrderStatus.Canceled);
                yield orderMapper.toResponse(orderRepository.save(order));
            }
            case Approved -> {
                deleteProductionTasksForOrder(order.getId());
                order.setStatus(OrderStatus.Canceled);
                yield orderMapper.toResponse(orderRepository.save(order));
            }
            case Producing -> {
                List<ProductionTask> tasks = productionTaskRepository.findByOrder_IdOrderByCreatedAtAsc(order.getId());
                for (ProductionTask t : tasks) {
                    if (!"Waiting".equals(t.getStatus())) {
                        throw new BusinessLogicException(
                                "Chỉ hủy được khi mọi lệnh SX còn Waiting (chưa bắt đầu thi công).");
                    }
                }
                deleteProductionTasksForOrder(order.getId());
                order.setStatus(OrderStatus.Canceled);
                yield orderMapper.toResponse(orderRepository.save(order));
            }
            case Done -> cancelDoneOrder(order, seller);
            default -> throw new BadRequestException("Không thể hủy đơn ở trạng thái: " + order.getStatus());
        };
    }

    private OrderResponse cancelDoneOrder(Order order, User seller) {
        if (order.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessLogicException(
                    "Không hủy đơn Done khi đã có thanh toán (paid_amount > 0).");
        }
        if (invoiceRepository.existsByOrder_IdAndStatusIn(order.getId(), List.of("Draft", "Issued"))) {
            throw new BusinessLogicException(
                    "Không hủy đơn khi còn hóa đơn Draft hoặc Issued — xử lý hóa đơn trước.");
        }

        restoreProductStockForOrderLines(order, seller, "Hủy đơn Done (nhập lại TP)");

        Agency agency = order.getAgency();
        BigDecimal newDebt = agency.getTotalDebt().subtract(order.getTotalPayable());
        if (newDebt.compareTo(BigDecimal.ZERO) < 0) {
            newDebt = BigDecimal.ZERO;
        }
        agency.setTotalDebt(newDebt);
        agencyRepository.save(agency);

        order.setStatus(OrderStatus.Canceled);
        return orderMapper.toResponse(orderRepository.save(order));
    }

    private void deleteProductionTasksForOrder(UUID orderId) {
        List<ProductionTask> tasks = productionTaskRepository.findByOrder_IdOrderByCreatedAtAsc(orderId);
        if (tasks.isEmpty()) {
            return;
        }
        List<UUID> taskIds = tasks.stream().map(ProductionTask::getId).toList();
        activityLogRepository.deleteByTask_IdIn(taskIds);
        productionTaskRepository.deleteAllInBatch(tasks);
    }

    private void restoreProductStockForOrderLines(Order order, User seller, String notePrefix) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);

            ProductInventoryLog log = ProductInventoryLog.builder()
                    .product(product)
                    .order(order)
                    .createdBy(seller)
                    .transactionType("IMPORT")
                    .quantityChange(item.getQuantity())
                    .note(notePrefix + " - Đơn #" + order.getId().toString().substring(0, 8))
                    .build();
            productInventoryLogRepository.save(log);
        }
    }

    // ========== Director methods ==========

    @Transactional(readOnly = true)
    public OrderResponse getDirectorOrderDetail(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
        return orderMapper.toResponse(order);
    }

    /**
     * Danh sách đơn cho giám đốc.
     * <p>Nếu không truyền {@code status}, {@code agency_id}, {@code from_date}, {@code to_date} thì giữ hành vi cũ: chỉ đơn {@link OrderStatus#Pending}.</p>
     * <p>Nếu có bất kỳ tham số lọc nào, áp dụng query đầy đủ; {@code status} rỗng khi đã có filter khác = mọi trạng thái.</p>
     */
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getDirectorOrders(String statusParam,
                                                          UUID agencyId,
                                                          LocalDate fromDate,
                                                          LocalDate toDate,
                                                          int page,
                                                          int size) {
        boolean hasAgency = agencyId != null;
        boolean hasFrom = fromDate != null;
        boolean hasTo = toDate != null;
        boolean hasStatusText = statusParam != null && !statusParam.isBlank();
        List<OrderStatus> parsedStatuses = hasStatusText ? parseStatuses(statusParam) : null;
        if (parsedStatuses != null && parsedStatuses.isEmpty()) {
            parsedStatuses = null;
        }

        if (!hasAgency && !hasFrom && !hasTo && !hasStatusText) {
            return getPendingOrders(page, size);
        }

        List<OrderStatus> statusesForQuery = parsedStatuses;
        LocalDateTime fromTs = hasFrom ? fromDate.atStartOfDay() : null;
        LocalDateTime toTs = hasTo ? toDate.plusDays(1).atStartOfDay() : null;

        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orderPage = orderRepository.findForDirector(statusesForQuery, agencyId, fromTs, toTs, pageable);
        return toPageResponse(orderPage);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getPendingOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orderPage = orderRepository.findByStatusOrderByCreatedAtAsc(OrderStatus.Pending, pageable);
        return toPageResponse(orderPage);
    }

    /**
     * Pending → Approved: ghi nhận giá vốn, gán người duyệt. Lệnh xưởng chỉ tạo khi seller {@link #pushProduction}.
     */
    @Transactional
    public OrderResponse approveOrder(UUID orderId, User director) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
        assertStatus(order, OrderStatus.Pending, "phê duyệt");

        for (OrderItem item : order.getItems()) {
            item.setUnitCostAtTime(item.getProduct().getCostPrice());
        }

        order.setStatus(OrderStatus.Approved);
        order.setApprover(director);
        Order saved = orderRepository.save(order);

        return orderMapper.toResponse(saved);
    }

    private void createProductionTasks(Order order) {
        for (OrderItem item : order.getItems()) {
            ProductionTask task = ProductionTask.builder()
                    .order(order)
                    .product(item.getProduct())
                    .quantity(item.getQuantity())
                    .status("Waiting")
                    .build();
            productionTaskRepository.save(task);
        }
    }

    @Transactional
    public OrderResponse rejectOrder(UUID orderId, User director, RejectOrderRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
        assertStatus(order, OrderStatus.Pending, "từ chối");

        order.setStatus(OrderStatus.Rejected);
        order.setApprover(director);
        if (request != null && request.getNote() != null) {
            order.setNote(request.getNote());
        }
        return orderMapper.toResponse(orderRepository.save(order));
    }

    /**
     * Pending → Draft: trả đơn cho seller sửa nội dung / báo giá lại rồi {@code submit} lên.
     * Không tạo task xưởng; xóa {@code approver} vì chưa phê duyệt.
     */
    @Transactional
    public OrderResponse requestOrderRevision(UUID orderId, RequestOrderRevisionRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
        assertStatus(order, OrderStatus.Pending, "yêu cầu chỉnh sửa");

        order.setStatus(OrderStatus.Draft);
        order.setApprover(null);
        if (request != null && request.getNote() != null) {
            order.setNote(request.getNote());
        }
        return orderMapper.toResponse(orderRepository.save(order));
    }

    // ========== Helpers ==========

    /**
     * {@code total_payable - paid_amount}, tối thiểu 0 — dùng khi kiểm hạn mức, ghi nợ khi giao Done, v.v.
     */
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

    private PageResponse<OrderResponse> toPageResponse(Page<Order> orderPage) {
        return PageResponse.<OrderResponse>builder()
                .content(orderPage.getContent().stream().map(orderMapper::toResponse).toList())
                .page(orderPage.getNumber())
                .size(orderPage.getSize())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .last(orderPage.isLast())
                .build();
    }

    public List<OrderStatus> parseStatuses(String statusParam) {
        if (statusParam == null || statusParam.isBlank()) {
            return null;
        }
        return Arrays.stream(statusParam.split(","))
                .map(String::trim)
                .map(s -> {
                    try {
                        return OrderStatus.valueOf(s);
                    } catch (IllegalArgumentException e) {
                        throw new BadRequestException("Trạng thái không hợp lệ: " + s);
                    }
                })
                .toList();
    }
}
