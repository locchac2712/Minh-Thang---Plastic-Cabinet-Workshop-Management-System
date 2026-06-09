package com.tuplastic.erp.director.controller;

import com.tuplastic.erp.agency.dto.AgencyResponse;
import com.tuplastic.erp.agency.dto.OverrideDebtRequest;
import com.tuplastic.erp.agency.service.AgencyService;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.order.dto.OrderResponse;
import com.tuplastic.erp.order.dto.RejectOrderRequest;
import com.tuplastic.erp.order.dto.RequestOrderRevisionRequest;
import com.tuplastic.erp.order.service.OrderService;
import com.tuplastic.erp.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/director/approvals")
@PreAuthorize("hasRole('DIRECTOR')")
@RequiredArgsConstructor
public class DirectorApprovalController {

    private final OrderService orderService;
    private final AgencyService agencyService;
    private final SecurityUtils securityUtils;

    /**
     * Danh sách đơn: mặc định (không query) = chỉ {@code Pending}. Có thể lọc thêm {@code status} (phân tách bằng dấu phẩy),
     * {@code agency_id}, {@code from_date}, {@code to_date} (theo ngày tạo đơn).
     */
    @GetMapping("/orders")
    public PageResponse<OrderResponse> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(name = "agency_id", required = false) UUID agencyId,
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return orderService.getDirectorOrders(status, agencyId, fromDate, toDate, page, size);
    }

    @GetMapping("/orders/{idOrCode}")
    public OrderResponse getOrderDetail(@PathVariable String idOrCode) {
        return orderService.getDirectorOrderDetail(idOrCode);
    }

    @PatchMapping("/orders/{idOrCode}/approve")
    public OrderResponse approveOrder(@PathVariable String idOrCode) {
        User director = securityUtils.getCurrentUser();
        return orderService.approveOrder(idOrCode, director);
    }

    @PatchMapping("/orders/{idOrCode}/reject")
    public OrderResponse rejectOrder(@PathVariable String idOrCode,
                                     @RequestBody(required = false) RejectOrderRequest request) {
        User director = securityUtils.getCurrentUser();
        return orderService.rejectOrder(idOrCode, director, request);
    }

    @PatchMapping("/orders/{idOrCode}/request-revision")
    public OrderResponse requestOrderRevision(@PathVariable String idOrCode,
                                              @RequestBody(required = false) RequestOrderRevisionRequest request) {
        return orderService.requestOrderRevision(idOrCode, request);
    }

    @PatchMapping("/agencies/{id}/override-debt")
    public AgencyResponse overrideDebtLimit(@PathVariable UUID id,
                                            @Valid @RequestBody OverrideDebtRequest request) {
        return agencyService.overrideDebtLimit(id, request);
    }
}
