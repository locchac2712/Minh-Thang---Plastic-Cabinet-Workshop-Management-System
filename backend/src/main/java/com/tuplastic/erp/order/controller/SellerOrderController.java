package com.tuplastic.erp.order.controller;

import com.tuplastic.erp.activitylog.dto.ActivityLogResponse;
import com.tuplastic.erp.activitylog.service.ActivityLogService;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.order.dto.CreateOrderRequest;
import com.tuplastic.erp.order.dto.DeliverBatchRequest;
import com.tuplastic.erp.order.dto.OrderFulfillmentSummaryDto;
import com.tuplastic.erp.order.dto.OrderResponse;
import com.tuplastic.erp.order.dto.SellerOrderTaskTimelineResponse;
import com.tuplastic.erp.order.service.OrderDeliveryService;
import com.tuplastic.erp.order.service.OrderService;
import com.tuplastic.erp.production.dto.TaskShareLinkResponse;
import com.tuplastic.erp.production.service.TaskTrackingService;
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
    private final OrderDeliveryService orderDeliveryService;
    private final ActivityLogService activityLogService;
    private final TaskTrackingService taskTrackingService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public PageResponse<OrderResponse> getMyOrders(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User seller = securityUtils.getCurrentUser();
        return orderService.getSellerOrders(seller, orderService.parseStatuses(status), page, size);
    }

    @GetMapping("/{idOrCode}")
    public OrderResponse getOrder(@PathVariable String idOrCode) {
        User seller = securityUtils.getCurrentUser();
        return orderService.getSellerOrderDetail(idOrCode, seller);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest request) {
        User seller = securityUtils.getCurrentUser();
        return orderService.createDraftOrder(request, seller);
    }

    @PutMapping("/{idOrCode}")
    public OrderResponse updateOrder(@PathVariable String idOrCode, @Valid @RequestBody CreateOrderRequest request) {
        User seller = securityUtils.getCurrentUser();
        return orderService.updateDraftOrder(idOrCode, request, seller);
    }

    @PatchMapping("/{idOrCode}/submit")
    public OrderResponse submitOrder(@PathVariable String idOrCode) {
        User seller = securityUtils.getCurrentUser();
        return orderService.submitOrder(idOrCode, seller);
    }

    @PatchMapping("/{idOrCode}/push-production")
    public OrderResponse pushProduction(@PathVariable String idOrCode) {
        User seller = securityUtils.getCurrentUser();
        return orderService.pushProduction(idOrCode, seller);
    }

    @PatchMapping("/{idOrCode}/deliver-instock")
    public OrderResponse deliverInStock(@PathVariable String idOrCode) {
        User seller = securityUtils.getCurrentUser();
        return orderService.deliverInStock(idOrCode, seller);
    }

    @PatchMapping("/{idOrCode}/mark-done")
    public OrderResponse markDone(@PathVariable String idOrCode) {
        User seller = securityUtils.getCurrentUser();
        return orderService.markDone(idOrCode, seller);
    }

    @PatchMapping("/{idOrCode}/deliver-batch")
    public OrderResponse deliverBatch(@PathVariable String idOrCode, @Valid @RequestBody DeliverBatchRequest request) {
        User seller = securityUtils.getCurrentUser();
        UUID orderId = orderService.resolveSellerFulfillmentOrderId(idOrCode, seller);
        return orderDeliveryService.deliverBatch(orderId, request, seller);
    }

    @GetMapping("/{idOrCode}/fulfillment")
    public OrderFulfillmentSummaryDto getFulfillment(@PathVariable String idOrCode) {
        User seller = securityUtils.getCurrentUser();
        UUID orderId = orderService.resolveSellerFulfillmentOrderId(idOrCode, seller);
        return orderDeliveryService.getFulfillmentSummary(orderId, seller);
    }

    @PatchMapping("/{idOrCode}/cancel")
    public OrderResponse cancelOrder(@PathVariable String idOrCode) {
        User seller = securityUtils.getCurrentUser();
        return orderService.cancelOrder(idOrCode, seller);
    }

    @GetMapping("/{idOrCode}/activity-logs")
    public List<ActivityLogResponse> getActivityLogs(@PathVariable String idOrCode) {
        User seller = securityUtils.getCurrentUser();
        UUID orderId = orderService.resolveSellerFulfillmentOrderId(idOrCode, seller);
        return activityLogService.getLogsByOrder(orderId, seller);
    }

    @GetMapping("/{idOrCode}/production-tasks")
    public List<SellerOrderTaskTimelineResponse> getProductionTasksWithLogs(@PathVariable String idOrCode) {
        User seller = securityUtils.getCurrentUser();
        UUID orderId = orderService.resolveSellerFulfillmentOrderId(idOrCode, seller);
        return activityLogService.getProductionTasksWithLogsByOrder(orderId, seller);
    }

    @PostMapping("/{idOrCode}/tasks/{taskId}/share-link")
    public TaskShareLinkResponse createTaskShareLink(@PathVariable String idOrCode, @PathVariable UUID taskId) {
        User seller = securityUtils.getCurrentUser();
        UUID orderId = orderService.resolveSellerFulfillmentOrderId(idOrCode, seller);
        return taskTrackingService.createOrGetShareLink(orderId, taskId, seller);
    }

    @DeleteMapping("/{idOrCode}/tasks/{taskId}/share-link")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revokeTaskShareLink(@PathVariable String idOrCode, @PathVariable UUID taskId) {
        User seller = securityUtils.getCurrentUser();
        UUID orderId = orderService.resolveSellerFulfillmentOrderId(idOrCode, seller);
        taskTrackingService.revokeShareLink(orderId, taskId, seller);
    }
}
