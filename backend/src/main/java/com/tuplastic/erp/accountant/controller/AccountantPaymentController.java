package com.tuplastic.erp.accountant.controller;

import com.tuplastic.erp.accountant.service.AccountantPaymentService;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.payment.dto.PaymentResponse;
import com.tuplastic.erp.payment.dto.RejectPaymentRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/accountant/payments")
@PreAuthorize("hasRole('ACCOUNTANT')")
@RequiredArgsConstructor
public class AccountantPaymentController {

    private final AccountantPaymentService accountantPaymentService;

    @GetMapping
    public PageResponse<PaymentResponse> listPayments(
            @RequestParam(required = false) String status,
            @RequestParam(name = "agency_id", required = false) UUID agencyId,
            @RequestParam(name = "order_id", required = false) UUID orderId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return accountantPaymentService.listPayments(status, agencyId, orderId, from, to, page, size);
    }

    @PatchMapping("/{id}/approve")
    public PaymentResponse approve(@PathVariable UUID id) {
        return accountantPaymentService.approvePayment(id);
    }

    @PatchMapping("/{id}/reject")
    public PaymentResponse reject(@PathVariable UUID id, @RequestBody(required = false) RejectPaymentRequest request) {
        return accountantPaymentService.rejectPayment(id, request);
    }
}
