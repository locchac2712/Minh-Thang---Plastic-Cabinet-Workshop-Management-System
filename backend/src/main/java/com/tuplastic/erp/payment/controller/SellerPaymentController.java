package com.tuplastic.erp.payment.controller;

import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.order.service.OrderService;
import com.tuplastic.erp.payment.dto.CreatePaymentRequest;
import com.tuplastic.erp.payment.dto.PatchSellerPaymentRequest;
import com.tuplastic.erp.payment.dto.PaymentResponse;
import com.tuplastic.erp.payment.service.PaymentService;
import com.tuplastic.erp.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@PreAuthorize("hasRole('SELLER')")
@RequiredArgsConstructor
public class SellerPaymentController {

    private final PaymentService paymentService;
    private final OrderService orderService;
    private final SecurityUtils securityUtils;

    @GetMapping("/api/seller/orders/{idOrCode}/payments")
    public List<PaymentResponse> getOrderPayments(@PathVariable String idOrCode) {
        User seller = securityUtils.getCurrentUser();
        UUID orderId = orderService.resolveSellerFulfillmentOrderId(idOrCode, seller);
        return paymentService.getPaymentsByOrder(orderId, seller);
    }

    @PostMapping("/api/seller/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse createPayment(@Valid @RequestBody CreatePaymentRequest request) {
        User seller = securityUtils.getCurrentUser();
        return paymentService.createPayment(request, seller);
    }

    @PatchMapping("/api/seller/payments/{id}")
    public PaymentResponse patchPendingPayment(@PathVariable UUID id,
                                               @Valid @RequestBody PatchSellerPaymentRequest request) {
        User seller = securityUtils.getCurrentUser();
        return paymentService.patchPendingPayment(id, request, seller);
    }
}
