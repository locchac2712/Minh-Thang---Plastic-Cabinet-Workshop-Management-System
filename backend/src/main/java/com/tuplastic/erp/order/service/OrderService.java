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
import com.tuplastic.erp.order.util.OrderCopyPricingUtils;
import com.tuplastic.erp.order.util.OrderDisplayCodeUtils;
import com.tuplastic.erp.order.util.OrderPhaseUtils;
import com.tuplastic.erp.invoice.repository.InvoiceRepository;
import com.tuplastic.erp.notification.service.NotificationService;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.reconcile.AgencyDebtComputationService;
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.product.repository.ProductRepository;
import com.tuplastic.erp.production.entity.ProductionTask;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.productinventory.entity.ProductInventoryLog;
import com.tuplastic.erp.productinventory.repository.ProductInventoryLogRepository;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.enums.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
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
    private final NotificationService notificationService;
    private final OrderDeliveryService orderDeliveryService;
    private final AgencyDebtComputationService agencyDebtComputationService;

    @Transactional(readOnly = true)
    public UUID resolveSellerFulfillmentOrderId(String idOrCode, User seller) {
        return findSellerFulfillmentOrderOrThrow(idOrCode, seller).getId();
    }

    @Transactional(readOnly = true)
    public OrderResponse getSellerOrderDetail(String idOrCode, User seller) {
        Order order = findSellerFulfillmentOrderOrThrow(idOrCode, seller);
        return orderMapper.toResponse(order);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getSellerOrders(User seller, List<OrderStatus> statuses,
                                                        int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orderPage = orderRepository.findFulfillmentOrdersBySellerWithFilters(
                seller.getId(), statuses, pageable);
        return toPageResponse(orderPage);
    }

    /** Đơn fulfillment của đại lý ({@code sourceOrder IS NOT NULL}) — cùng lens {@link #getSellerOrders}. */
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAgencyOrders(UUID agencyId, User seller,
                                                        List<OrderStatus> statuses,
                                                        int page, int size) {
        agencyRepository.findByIdAndAssignedSellerId(agencyId, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Đại lý", "id", agencyId));
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orderPage = orderRepository.findAll(
                agencyOrdersFilterSpec(agencyId, seller.getId(), statuses),
                pageable);
        return toPageResponse(orderPage);
    }

    /** Đơn fulfillment của đại lý — admin / giám đốc (mọi NVBH). */
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAgencyOrdersForAdmin(UUID agencyId,
                                                                List<OrderStatus> statuses,
                                                                int page, int size) {
        if (!agencyRepository.existsById(agencyId)) {
            throw new ResourceNotFoundException("Đại lý", "id", agencyId);
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orderPage = orderRepository.findAll(
                agencyOrdersFilterSpec(agencyId, null, statuses),
                pageable);
        return toPageResponse(orderPage);
    }

    /** Báo giá (BG) của đại lý — admin / giám đốc (mọi NVBH). */
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAgencyQuotationsForAdmin(UUID agencyId,
                                                                  List<OrderStatus> statuses,
                                                                  int page, int size) {
        if (!agencyRepository.existsById(agencyId)) {
            throw new ResourceNotFoundException("Đại lý", "id", agencyId);
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orderPage = orderRepository.findAll(
                agencyQuotationsFilterSpec(agencyId, statuses),
                pageable);
        return toPageResponse(orderPage);
    }

    /**
     * Danh sách đơn dưới góc nhìn “báo giá”: cùng phân trang/lọc như {@link #getSellerOrders},
     * nhưng query param {@code status} dùng ô gộp {@code Draft|Pending|Approved|Rejected|Canceled}
     * (Approved = đơn đã chốt: Approved, Producing, Done).
     */
    @Transactional(readOnly = true)
    public PageResponse<QuotationOrderResponse> getSellerQuotations(User seller, List<OrderStatus> statusesFilter,
                                                                   String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orderPage = orderRepository.findAll(
                sellerQuotationsFilterSpec(seller.getId(), statusesFilter, normalizeQuotationSearch(search)),
                pageable);
        return toQuotationPageResponse(orderPage);
    }

    /**
     * Lọc báo giá seller — Specification tránh bind {@code :search IS NULL} gây lỗi PostgreSQL {@code bytea}.
     */
    static Specification<Order> sellerQuotationsFilterSpec(UUID sellerId,
                                                           List<OrderStatus> statuses,
                                                           String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("createdBy").get("id"), sellerId));
            predicates.add(cb.isNull(root.get("sourceOrder")));
            if (statuses != null && !statuses.isEmpty()) {
                predicates.add(root.get("status").in(statuses));
            }
            if (search != null) {
                predicates.add(cb.like(root.get("displayCode"), "%" + search + "%"));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    /** Trim; blank → null. Uppercase để khớp format mã BG-YYYY-NNNNN. */
    static String normalizeQuotationSearch(String search) {
        if (search == null) {
            return null;
        }
        String trimmed = search.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed.toUpperCase();
    }

    @Transactional(readOnly = true)
    public QuotationOrderResponse getSellerQuotationDetail(String idOrCode, User seller) {
        return toQuotationResponse(findSellerQuotationOrThrow(idOrCode, seller));
    }

    /**
     * Đơn fulfillment đã tạo từ một báo giá — {@code sourceOrder.id = quotation.id}.
     */
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getSellerQuotationFulfillmentOrders(String idOrCode, User seller,
                                                                            List<OrderStatus> statuses,
                                                                            int page, int size) {
        Order quotation = findSellerQuotationOrThrow(idOrCode, seller);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orderPage = orderRepository.findAll(
                quotationChildOrdersFilterSpec(quotation.getId(), seller.getId(), statuses),
                pageable);
        return toPageResponse(orderPage);
    }

    /**
     * Lọc đơn con của báo giá seller — lens fulfillment ({@code sourceOrder IS NOT NULL}).
     */
    static Specification<Order> quotationChildOrdersFilterSpec(UUID sourceQuotationId,
                                                               UUID sellerId,
                                                               List<OrderStatus> statuses) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isNotNull(root.get("sourceOrder")));
            predicates.add(cb.equal(root.get("sourceOrder").get("id"), sourceQuotationId));
            predicates.add(cb.equal(root.get("createdBy").get("id"), sellerId));
            if (statuses != null && !statuses.isEmpty()) {
                predicates.add(root.get("status").in(statuses));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
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
                    OrderStatus.Approved, OrderStatus.Producing, OrderStatus.Done);
            case "Canceled" -> EnumSet.of(OrderStatus.Canceled);
            default -> throw new BadRequestException(
                    "Trạng thái báo giá không hợp lệ: " + view
                            + ". Chấp nhận: Draft, Pending, Approved, Rejected, Canceled");
        };
    }

    public static String quotationViewFromOrderStatus(OrderStatus status) {
        return switch (status) {
            case Draft -> "Draft";
            case Pending -> "Pending";
            case Rejected -> "Rejected";
            case Canceled -> "Canceled";
            case Approved, Producing, Done -> "Approved";
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

        assertQuotationValidUntil(request.getQuotationValidUntil());

        Order sourceOrder = request.getSourceOrderId() != null
                ? resolveSourceOrderForCopy(request.getSourceOrderId(), seller, agency)
                : null;
        boolean autoApprove = sourceOrder != null
                && OrderCopyPricingUtils.isPricingAlignedWithSource(sourceOrder, request);

        Order order = Order.builder()
                .agency(agency)
                .createdBy(seller)
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .shippingFee(request.getShippingFee() != null ? request.getShippingFee() : BigDecimal.ZERO)
                .shippingAddress(request.getShippingAddress())
                .note(request.getNote())
                .quotationValidUntil(request.getQuotationValidUntil())
                .sourceOrder(sourceOrder)
                .status(autoApprove ? OrderStatus.Approved : OrderStatus.Draft)
                .build();

        BigDecimal totalAmount = populateOrderLineItems(order, request.getItems());
        applyOrderMoneyFields(order, totalAmount);

        if (autoApprove) {
            applyFulfillmentApprovedCosts(order, sourceOrder);
            order.setApprover(sourceOrder.getApprover());
            assertAgencyDebtLimitForOrder(order);
        }

        order.setDisplayCode(OrderDisplayCodeUtils.allocateDisplayCode(sourceOrder == null, orderRepository));

        Order saved = orderRepository.save(order);
        return orderMapper.toResponse(saved);
    }

    /**
     * Chỉ đơn nháp (Draft). Ghi đè header + toàn bộ dòng hàng.
     */
    @Transactional
    public OrderResponse updateDraftOrder(String idOrCode, CreateOrderRequest request, User seller) {
        Order order = findSellerOrderOrThrow(idOrCode, seller);
        assertStatus(order, OrderStatus.Draft, "cập nhật đơn");

        assertQuotationValidUntil(request.getQuotationValidUntil());

        Agency agency = agencyRepository.findByIdAndAssignedSellerId(request.getAgencyId(), seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Đại lý", "id", request.getAgencyId()));

        order.setAgency(agency);
        order.setDiscountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO);
        order.setShippingFee(request.getShippingFee() != null ? request.getShippingFee() : BigDecimal.ZERO);
        order.setShippingAddress(request.getShippingAddress());
        order.setNote(request.getNote());
        order.setQuotationValidUntil(request.getQuotationValidUntil());

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
     * Draft → Pending: Gửi đơn chờ duyệt.
     * Báo giá ({@code sourceOrder == null}): không kiểm hạn mức — enforcement ở tạo đơn fulfillment.
     * Đơn fulfillment nháp ({@code sourceOrder != null}): kiểm hạn mức trước khi gửi duyệt lại.
     */
    @Transactional
    public OrderResponse submitOrder(String idOrCode, User seller) {
        Order order = findSellerOrderOrThrow(idOrCode, seller);
        assertStatus(order, OrderStatus.Draft, "gửi duyệt");

        if (order.getSourceOrder() != null) {
            assertAgencyDebtLimitForOrder(order);
        }

        order.setStatus(OrderStatus.Pending);
        Order saved = orderRepository.save(order);
        notificationService.notifyRoles(
                Set.of(UserRole.DIRECTOR),
                "QUOTATION_SUBMITTED",
                "Yeu cau duyet bao gia",
                String.format("Don %s cua dai ly %s dang cho duyet.", shortOrderId(saved), saved.getAgency().getName()),
                "/director/approvals?status=Pending",
                null,
                seller,
                null
        );
        return orderMapper.toResponse(saved);
    }

    /**
     * Approved → Producing: Ép lệnh xuống xưởng. Lô SX tạo riêng qua {@link com.tuplastic.erp.production.service.ProductionBatchService#createBatch}.
     */
    @Transactional
    public OrderResponse pushProduction(String idOrCode, User seller) {
        Order order = findSellerFulfillmentOrderOrThrow(idOrCode, seller);
        assertStatus(order, OrderStatus.Approved, "ép lệnh sản xuất");

        order.setStatus(OrderStatus.Producing);
        Order saved = orderRepository.save(order);
        notificationService.notifyRoles(
                Set.of(UserRole.PRODUCTION),
                "ORDER_PUSHED_TO_PRODUCTION",
                "Đơn mới cho xưởng",
                String.format(
                        "Seller đã đẩy đơn %s (%s) xuống sản xuất. Tạo lô tại Lệnh theo đơn.",
                        shortOrderId(saved),
                        saved.getAgency().getName()),
                "/production/tasks/by-order",
                "order-push-production:" + saved.getId(),
                seller,
                null);
        return orderMapper.toResponse(saved);
    }

    /**
     * Draft → Done: Bán hàng có sẵn (mì ăn liền). Trừ kho thành phẩm.
     * Yêu cầu: tồn kho đủ cho từng dòng.
     */
    @Transactional
    public OrderResponse deliverInStock(String idOrCode, User seller) {
        Order order = findSellerFulfillmentOrderOrThrow(idOrCode, seller);
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
     * Producing → Done: Chốt đơn sau khi giao đủ từng lô ({@link OrderDeliveryService#deliverBatch}).
     * Ghi nợ một lần; không xuất kho bulk.
     */
    @Transactional
    public OrderResponse markDone(String idOrCode, User seller) {
        Order order = findSellerFulfillmentOrderOrThrow(idOrCode, seller);
        return orderDeliveryService.markDone(order.getId(), seller);
    }

    /**
     * Hủy đơn (Canceled). Draft/Pending/Rejected: chỉ đổi trạng thái. Approved: xóa lệnh SX Waiting nếu có.
     * Producing: chỉ khi mọi lệnh SX còn Waiting. Done: nhập lại TP, trừ công nợ — không cho nếu đã thu tiền hoặc có hóa đơn Draft/Issued.
     */
    @Transactional
    public OrderResponse cancelOrder(String idOrCode, User seller) {
        Order order = findSellerOrderOrThrow(idOrCode, seller);
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
                    if (t.getDeliveredAt() != null) {
                        throw new BusinessLogicException(
                                "Không hủy đơn khi đã giao ít nhất một lô sản xuất.");
                    }
                    if (!"Waiting".equals(t.getStatus())) {
                        throw new BusinessLogicException(
                                "Chỉ hủy được khi mọi lô SX còn Waiting (chưa bắt đầu thi công).");
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
    public OrderResponse getDirectorOrderDetail(String idOrCode) {
        Order order = findDirectorQuotationOrThrow(idOrCode);
        return toDirectorResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getDirectorFulfillmentOrderDetail(String idOrCode) {
        Order order = findDirectorFulfillmentOrderOrThrow(idOrCode);
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

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orderPage = orderRepository.findAll(
                directorOrderFilterSpec(statusesForQuery, agencyId, fromTs, toTs),
                pageable);
        return toDirectorPageResponse(orderPage);
    }

    /**
     * Lọc đơn cho giám đốc — dùng Specification thay JPQL {@code :param IS NULL} để tránh lỗi
     * PostgreSQL {@code could not determine data type of parameter}.
     */
    private static Specification<Order> directorOrderFilterSpec(List<OrderStatus> statuses,
                                                                 UUID agencyId,
                                                                 LocalDateTime fromTs,
                                                                 LocalDateTime toTs) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (statuses != null && !statuses.isEmpty()) {
                predicates.add(root.get("status").in(statuses));
            }
            if (agencyId != null) {
                predicates.add(cb.equal(root.get("agency").get("id"), agencyId));
            }
            if (fromTs != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromTs));
            }
            if (toTs != null) {
                predicates.add(cb.lessThan(root.get("createdAt"), toTs));
            }
            predicates.add(cb.isNull(root.get("sourceOrder")));
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static Specification<Order> agencyOrdersFilterSpec(UUID agencyId,
                                                                 UUID sellerId,
                                                                 List<OrderStatus> statuses) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("agency").get("id"), agencyId));
            predicates.add(cb.isNotNull(root.get("sourceOrder")));
            if (sellerId != null) {
                predicates.add(cb.equal(root.get("createdBy").get("id"), sellerId));
            }
            if (statuses != null && !statuses.isEmpty()) {
                predicates.add(root.get("status").in(statuses));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static Specification<Order> agencyQuotationsFilterSpec(UUID agencyId,
                                                                    List<OrderStatus> statuses) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("agency").get("id"), agencyId));
            predicates.add(cb.isNull(root.get("sourceOrder")));
            if (statuses != null && !statuses.isEmpty()) {
                predicates.add(root.get("status").in(statuses));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getPendingOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orderPage = orderRepository.findByStatusAndSourceOrderIsNullOrderByCreatedAtAsc(
                OrderStatus.Pending, pageable);
        return toDirectorPageResponse(orderPage);
    }

    /**
     * Pending → Approved: ghi nhận giá vốn, gán người duyệt. Lô SX tạo sau khi seller push-production + xưởng create-batch.
     */
    @Transactional
    public OrderResponse approveOrder(String idOrCode, User director) {
        Order order = findDirectorQuotationOrThrow(idOrCode);
        assertStatus(order, OrderStatus.Pending, "phê duyệt");

        for (OrderItem item : order.getItems()) {
            item.setUnitCostAtTime(item.getProduct().getCostPrice());
        }

        order.setStatus(OrderStatus.Approved);
        order.setApprover(director);
        Order saved = orderRepository.save(order);
        notificationService.notifyUser(
                saved.getCreatedBy(),
                "QUOTATION_APPROVED",
                "Bao gia da duoc duyet",
                String.format("Don %s da duoc phe duyet.", shortOrderId(saved)),
                "/seller/quotations?status=Approved",
                null,
                director,
                null
        );

        return toDirectorResponse(saved);
    }

    @Transactional
    public OrderResponse rejectOrder(String idOrCode, User director, RejectOrderRequest request) {
        Order order = findDirectorQuotationOrThrow(idOrCode);
        assertStatus(order, OrderStatus.Pending, "từ chối");

        order.setStatus(OrderStatus.Rejected);
        order.setApprover(director);
        if (request != null && request.getNote() != null) {
            order.setNote(request.getNote());
        }
        Order saved = orderRepository.save(order);
        notificationService.notifyUser(
                saved.getCreatedBy(),
                "QUOTATION_REJECTED",
                "Bao gia bi tu choi",
                String.format("Don %s bi tu choi. Vui long xem ghi chu.", shortOrderId(saved)),
                "/seller/quotations?status=Rejected",
                null,
                director,
                null
        );
        return toDirectorResponse(saved);
    }

    /**
     * Pending → Draft: trả đơn cho seller sửa nội dung / báo giá lại rồi {@code submit} lên.
     * Không tạo task xưởng; xóa {@code approver} vì chưa phê duyệt.
     */
    @Transactional
    public OrderResponse requestOrderRevision(String idOrCode, RequestOrderRevisionRequest request) {
        Order order = findDirectorQuotationOrThrow(idOrCode);
        assertStatus(order, OrderStatus.Pending, "yêu cầu chỉnh sửa");

        order.setStatus(OrderStatus.Draft);
        order.setApprover(null);
        if (request != null && request.getNote() != null) {
            order.setNote(request.getNote());
        }
        Order saved = orderRepository.save(order);
        notificationService.notifyUser(
                saved.getCreatedBy(),
                "QUOTATION_REVISION_REQUESTED",
                "Yeu cau chinh sua bao gia",
                String.format("Don %s can chinh sua va gui duyet lai.", shortOrderId(saved)),
                "/seller/quotations?status=Draft",
                null,
                null,
                null
        );
        return toDirectorResponse(saved);
    }

    // ========== Helpers ==========

    /**
     * {@code total_payable - paid_amount}, tối thiểu 0 — dùng khi kiểm hạn mức, ghi nợ khi giao Done, v.v.
     */
    private static BigDecimal orderUnpaidBalance(Order order) {
        BigDecimal unpaid = order.getTotalPayable().subtract(order.getPaidAmount());
        return unpaid.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : unpaid;
    }

    private static String shortOrderId(Order order) {
        return OrderDisplayCodeUtils.displayRef(order.getDisplayCode(), order.getId());
    }

    private Order findSellerOrderOrThrow(String idOrCode, User seller) {
        UUID uuid = OrderDisplayCodeUtils.parseUuid(idOrCode);
        if (uuid != null) {
            return findSellerOrderOrThrow(uuid, seller);
        }
        return orderRepository.findByDisplayCodeAndCreatedById(idOrCode.trim(), seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "mã", idOrCode));
    }

    private Order findSellerQuotationOrThrow(String idOrCode, User seller) {
        Order order = findSellerOrderOrThrow(idOrCode, seller);
        assertQuotationRecord(order);
        return order;
    }

    private Order findSellerFulfillmentOrderOrThrow(String idOrCode, User seller) {
        Order order = findSellerOrderOrThrow(idOrCode, seller);
        assertFulfillmentRecord(order);
        return order;
    }

    private Order findDirectorQuotationOrThrow(String idOrCode) {
        Order order = resolveDirectorOrder(idOrCode);
        assertQuotationRecord(order);
        return order;
    }

    private Order findDirectorFulfillmentOrderOrThrow(String idOrCode) {
        Order order = resolveDirectorOrder(idOrCode);
        assertFulfillmentRecord(order);
        return order;
    }

    public Order resolveDirectorOrder(String idOrCode) {
        UUID uuid = OrderDisplayCodeUtils.parseUuid(idOrCode);
        if (uuid != null) {
            return orderRepository.findById(uuid)
                    .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", uuid));
        }
        return orderRepository.findByDisplayCode(idOrCode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "mã", idOrCode));
    }

    private static void assertQuotationRecord(Order order) {
        if (order.getSourceOrder() != null) {
            throw new ResourceNotFoundException(
                    "Báo giá", "mã", order.getDisplayCode() != null ? order.getDisplayCode() : order.getId());
        }
    }

    private static void assertFulfillmentRecord(Order order) {
        if (order.getSourceOrder() == null) {
            throw new ResourceNotFoundException(
                    "Đơn hàng", "mã", order.getDisplayCode() != null ? order.getDisplayCode() : order.getId());
        }
    }

    private Order findSellerOrderOrThrow(UUID orderId, User seller) {
        return orderRepository.findByIdAndCreatedById(orderId, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
    }

    /**
     * Khi tạo đơn từ copy báo giá: xác thực bản ghi nguồn thuộc NVBH, cùng đại lý, Approved+ và chưa hết hạn.
     */
    private Order resolveSourceOrderForCopy(UUID sourceOrderId, User seller, Agency agency) {
        if (sourceOrderId == null) {
            return null;
        }
        Order source = findSellerOrderOrThrow(sourceOrderId, seller);
        if (!source.getAgency().getId().equals(agency.getId())) {
            throw new BadRequestException("Đơn nguồn không thuộc đại lý của đơn mới.");
        }
        if (!OrderPhaseUtils.canCopyFromOrderStatus(source.getStatus())) {
            throw new BadRequestException(
                    String.format("Không thể tạo đơn từ báo giá ở trạng thái '%s'.", source.getStatus()));
        }
        LocalDate validUntil = source.getQuotationValidUntil();
        if (validUntil != null && validUntil.isBefore(LocalDate.now())) {
            throw new BadRequestException("Báo giá nguồn đã hết hạn hiệu lực.");
        }
        return source;
    }

    private void assertQuotationValidUntil(LocalDate validUntil) {
        if (validUntil != null && validUntil.isBefore(LocalDate.now())) {
            throw new BadRequestException("Hạn báo giá không được là ngày trong quá khứ.");
        }
    }

    private void assertAgencyDebtLimitForOrder(Order order) {
        Agency agency = order.getAgency();
        BigDecimal thisOrderUnpaid = orderUnpaidBalance(order);
        BigDecimal currentDebt = agencyDebtComputationService.computeForAgency(agency.getId());
        BigDecimal projectedDebt = currentDebt.add(thisOrderUnpaid);
        if (projectedDebt.compareTo(agency.getMaxDebtLimit()) > 0) {
            throw new BusinessLogicException(
                    String.format("Vượt hạn mức công nợ! Dư nợ theo đơn Done: %s + Phần chưa thu của đơn này: %s = %s > Trần nợ: %s. Liên hệ Giám đốc nâng hạn mức.",
                            currentDebt.toPlainString(),
                            thisOrderUnpaid.toPlainString(),
                            projectedDebt.toPlainString(),
                            agency.getMaxDebtLimit().toPlainString()));
        }
    }

    /** Ghi nhận giá vốn khi auto-approve đơn fulfillment — ưu tiên cost tại thời điểm duyệt báo giá gốc. */
    private static void applyFulfillmentApprovedCosts(Order order, Order sourceOrder) {
        java.util.Map<UUID, BigDecimal> costByProduct = new java.util.HashMap<>();
        if (sourceOrder.getItems() != null) {
            for (OrderItem sourceItem : sourceOrder.getItems()) {
                if (sourceItem.getProduct() != null && sourceItem.getProduct().getId() != null) {
                    costByProduct.put(sourceItem.getProduct().getId(), sourceItem.getUnitCostAtTime());
                }
            }
        }
        for (OrderItem item : order.getItems()) {
            UUID productId = item.getProduct().getId();
            BigDecimal cost = costByProduct.get(productId);
            if (cost == null) {
                cost = item.getProduct().getCostPrice();
            }
            item.setUnitCostAtTime(cost);
        }
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

    private PageResponse<OrderResponse> toDirectorPageResponse(Page<Order> orderPage) {
        return PageResponse.<OrderResponse>builder()
                .content(orderPage.getContent().stream().map(this::toDirectorResponse).toList())
                .page(orderPage.getNumber())
                .size(orderPage.getSize())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .last(orderPage.isLast())
                .build();
    }

    private OrderResponse toDirectorResponse(Order order) {
        OrderResponse response = orderMapper.toResponse(order);
        enrichDirectorApprovalMetrics(order, response);
        return response;
    }

    private void enrichDirectorApprovalMetrics(Order order, OrderResponse response) {
        if (response.getItems() != null) {
            for (int i = 0; i < order.getItems().size() && i < response.getItems().size(); i++) {
                OrderItem entity = order.getItems().get(i);
                OrderItemResponse itemResponse = response.getItems().get(i);
                if (itemResponse.getUnitCostAtTime() == null) {
                    BigDecimal estimated = DirectorApprovalMetricsCalculator.resolveUnitCost(entity);
                    if (estimated != null) {
                        itemResponse.setUnitCostAtTime(estimated);
                    }
                }
            }
        }
        response.setMarginPercent(DirectorApprovalMetricsCalculator.computeMarginPercent(order));
        response.setFloorMarginPercent(DirectorApprovalMetricsCalculator.floorMarginPercent(order));
        response.setApprovalSlaDueAt(DirectorApprovalMetricsCalculator.approvalSlaDueAt(order));
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
