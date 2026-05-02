package com.tuplastic.erp.invoice.controller;

import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.invoice.dto.InvoiceResponse;
import com.tuplastic.erp.invoice.service.SellerInvoiceService;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/seller")
@PreAuthorize("hasRole('SELLER')")
@RequiredArgsConstructor
public class SellerInvoiceController {

    private final SellerInvoiceService sellerInvoiceService;
    private final SecurityUtils securityUtils;

    @GetMapping("/orders/{orderId}/invoices")
    public List<InvoiceResponse> listByOrder(@PathVariable UUID orderId) {
        User seller = securityUtils.getCurrentUser();
        return sellerInvoiceService.listByOrder(orderId, seller);
    }

    @GetMapping("/invoices/{id}")
    public InvoiceResponse getById(@PathVariable UUID id) {
        User seller = securityUtils.getCurrentUser();
        return sellerInvoiceService.getById(id, seller);
    }
}
