package com.tuplastic.erp.order.controller;

import com.tuplastic.erp.activitylog.dto.ActivityLogResponse;
import com.tuplastic.erp.activitylog.service.ActivityLogService;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.order.dto.CreateOrderRequest;
import com.tuplastic.erp.order.dto.OrderResponse;
import com.tuplastic.erp.order.dto.SellerOrderTaskTimelineResponse;
import com.tuplastic.erp.order.service.OrderService;
import com.tuplastic.erp.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/seller/orders")
@PreAuthorize("hasRole('SELLER')")
@RequiredArgsConstructor
public class SellerOrderController {

    private final OrderService orderService;
    private final ActivityLogService activityLogService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public PageResponse<OrderResponse> getMyOrders(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User seller = securityUtils.getCurrentUser();
        return orderService.getSellerOrders(seller, orderService.parseStatuses(status), page, size);
    }

    @GetMapping("/{id}")
    public OrderResponse getOrder(@PathVariable UUID id) {
        User seller = securityUtils.getCurrentUser();
        return orderService.getSellerOrderDetail(id, seller);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest request) {
        User seller = securityUtils.getCurrentUser();
        return orderService.createDraftOrder(request, seller);
    }

    /**
     * Cập nhật toàn bộ nội dung đơn nháp (cùng body với tạo đơn). Chỉ khi trạng thái Draft.
     */
    @PutMapping("/{id}")
    public OrderResponse updateOrder(@PathVariable UUID id, @Valid @RequestBody CreateOrderRequest request) {
        User seller = securityUtils.getCurrentUser();
        return orderService.updateDraftOrder(id, request, seller);
    }

    @PatchMapping("/{id}/submit")
    public OrderResponse submitOrder(@PathVariable UUID id) {
        User seller = securityUtils.getCurrentUser();
        return orderService.submitOrder(id, seller);
    }

    @PatchMapping("/{id}/push-production")
    public OrderResponse pushProduction(@PathVariable UUID id) {
        User seller = securityUtils.getCurrentUser();
        return orderService.pushProduction(id, seller);
    }

    @PatchMapping("/{id}/deliver-instock")
    public OrderResponse deliverInStock(@PathVariable UUID id) {
        User seller = securityUtils.getCurrentUser();
        return orderService.deliverInStock(id, seller);
    }

    @PatchMapping("/{id}/mark-done")
    public OrderResponse markDone(@PathVariable UUID id) {
        User seller = securityUtils.getCurrentUser();
        return orderService.markDone(id, seller);
    }

    /** Hủy đơn theo quy tắc nghiệp vụ (Draft → Done, trừ trường hợp bị chặn). */
    @PatchMapping("/{id}/cancel")
    public OrderResponse cancelOrder(@PathVariable UUID id) {
        User seller = securityUtils.getCurrentUser();
        return orderService.cancelOrder(id, seller);
    }

    @GetMapping("/{id}/activity-logs")
    public List<ActivityLogResponse> getActivityLogs(@PathVariable UUID id) {
        User seller = securityUtils.getCurrentUser();
        return activityLogService.getLogsByOrder(id, seller);
    }

    /**
     * Lệnh SX theo đơn + log từng lệnh (khác {@code /activity-logs} — API cũ trả list log phẳng gộp chung).
     */
    @GetMapping("/{id}/production-tasks")
    public List<SellerOrderTaskTimelineResponse> getProductionTasksWithLogs(@PathVariable UUID id) {
        User seller = securityUtils.getCurrentUser();
        return activityLogService.getProductionTasksWithLogsByOrder(id, seller);
    }
}
