package com.tuplastic.erp.order.controller;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.order.dto.OrderResponse;
import com.tuplastic.erp.order.dto.QuotationOrderResponse;
import com.tuplastic.erp.order.service.OrderService;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Báo giá (góc nhìn gộp): cùng dữ liệu đơn như {@code /api/seller/orders}, thêm {@code quotationStatus}
 * với 5 giá trị Draft / Pending / Approved / Rejected / Canceled; {@code Approved} gộp Approved+Producing+Done.
 */
@RestController
@RequestMapping("/api/seller/quotations")
@PreAuthorize("hasRole('SELLER')")
@RequiredArgsConstructor
public class SellerQuotationController {

    private final OrderService orderService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public PageResponse<QuotationOrderResponse> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User seller = securityUtils.getCurrentUser();
        return orderService.getSellerQuotations(
                seller, orderService.parseQuotationStatuses(status), search, page, size);
    }

    @GetMapping("/{idOrCode}")
    public QuotationOrderResponse getOne(@PathVariable String idOrCode) {
        User seller = securityUtils.getCurrentUser();
        return orderService.getSellerQuotationDetail(idOrCode, seller);
    }

    @GetMapping("/{idOrCode}/orders")
    public PageResponse<OrderResponse> listFulfillmentOrders(
            @PathVariable String idOrCode,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User seller = securityUtils.getCurrentUser();
        return orderService.getSellerQuotationFulfillmentOrders(
                idOrCode, seller, orderService.parseStatuses(status), page, size);
    }
}
