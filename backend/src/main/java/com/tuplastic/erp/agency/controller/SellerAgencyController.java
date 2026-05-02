package com.tuplastic.erp.agency.controller;

import com.tuplastic.erp.agency.dto.AgencyResponse;
import com.tuplastic.erp.agency.dto.CreateAgencyRequest;
import com.tuplastic.erp.agency.dto.SellerUpdateAgencyRequest;
import com.tuplastic.erp.agency.service.AgencyService;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.order.dto.OrderResponse;
import com.tuplastic.erp.order.service.OrderService;
import com.tuplastic.erp.payment.dto.PaymentResponse;
import com.tuplastic.erp.payment.service.PaymentService;
import com.tuplastic.erp.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/seller/agencies")
@PreAuthorize("hasRole('SELLER')")
@RequiredArgsConstructor
public class SellerAgencyController {

    private final AgencyService agencyService;
    private final OrderService orderService;
    private final PaymentService paymentService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public PageResponse<AgencyResponse> getMyAgencies(
            @RequestParam(required = false) String search,
            @RequestParam(name = "total_debt_gt", required = false) BigDecimal totalDebtGt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User seller = securityUtils.getCurrentUser();
        return agencyService.getSellerAgencies(seller, search, totalDebtGt, page, size);
    }

    @GetMapping("/{id}")
    public AgencyResponse getAgencyDetail(@PathVariable UUID id) {
        User seller = securityUtils.getCurrentUser();
        return agencyService.getSellerAgencyDetail(id, seller);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AgencyResponse createAgency(@Valid @RequestBody CreateAgencyRequest request) {
        User seller = securityUtils.getCurrentUser();
        return agencyService.createAgency(request, seller);
    }

    @PutMapping("/{id}")
    public AgencyResponse updateAgency(@PathVariable UUID id,
                                       @Valid @RequestBody SellerUpdateAgencyRequest request) {
        User seller = securityUtils.getCurrentUser();
        return agencyService.sellerUpdateAgency(id, request, seller);
    }

    @GetMapping("/{id}/orders")
    public PageResponse<OrderResponse> getAgencyOrders(
            @PathVariable UUID id,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User seller = securityUtils.getCurrentUser();
        return orderService.getAgencyOrders(id, seller, orderService.parseStatuses(status), page, size);
    }

    @GetMapping("/{id}/payments")
    public PageResponse<PaymentResponse> getAgencyPayments(
            @PathVariable UUID id,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User seller = securityUtils.getCurrentUser();
        return paymentService.getPaymentsByAgency(id, status, seller, page, size);
    }
}
