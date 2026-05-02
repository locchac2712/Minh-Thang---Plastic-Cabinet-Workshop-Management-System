package com.tuplastic.erp.order.controller;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.order.dto.QuotationOrderResponse;
import com.tuplastic.erp.order.service.OrderService;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Báo giá (góc nhìn gộp): cùng dữ liệu đơn như {@code /api/seller/orders}, thêm {@code quotationStatus}
 * với 4 giá trị Draft / Pending / Approved / Rejected; {@code Approved} gộp Approved+Producing+Done+Canceled.
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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User seller = securityUtils.getCurrentUser();
        return orderService.getSellerQuotations(seller, orderService.parseQuotationStatuses(status), page, size);
    }

    @GetMapping("/{id}")
    public QuotationOrderResponse getOne(@PathVariable UUID id) {
        User seller = securityUtils.getCurrentUser();
        return orderService.getSellerQuotationDetail(id, seller);
    }
}
