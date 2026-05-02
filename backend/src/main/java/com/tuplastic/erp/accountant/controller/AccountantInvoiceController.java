package com.tuplastic.erp.accountant.controller;

import com.tuplastic.erp.accountant.service.AccountantInvoiceService;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.invoice.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/accountant/invoices")
@PreAuthorize("hasRole('ACCOUNTANT')")
@RequiredArgsConstructor
public class AccountantInvoiceController {

    private final AccountantInvoiceService accountantInvoiceService;

    @GetMapping("/eligible-orders")
    public PageResponse<EligibleOrderForInvoiceResponse> listEligibleOrders(
            @RequestParam(name = "order_status", required = false) String orderStatus,
            @RequestParam(name = "invoiced", required = false) Boolean invoiced,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return accountantInvoiceService.listEligibleOrders(orderStatus, invoiced, page, size);
    }

    @GetMapping
    public PageResponse<InvoiceResponse> listInvoices(
            @RequestParam(required = false) String status,
            @RequestParam(name = "order_id", required = false) UUID orderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return accountantInvoiceService.listInvoices(status, orderId, page, size);
    }

    @GetMapping("/{id}")
    public InvoiceResponse getInvoice(@PathVariable UUID id) {
        return accountantInvoiceService.getInvoice(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InvoiceCreatedResponse create(@Valid @RequestBody CreateInvoiceRequest request) {
        return accountantInvoiceService.createDraft(request);
    }

    @PatchMapping("/{id}/issued")
    public InvoiceResponse markIssued(@PathVariable UUID id, @Valid @RequestBody IssueInvoiceRequest request) {
        return accountantInvoiceService.markIssued(id, request);
    }

    @PatchMapping("/{id}/cancel")
    public InvoiceResponse cancel(@PathVariable UUID id, @RequestBody(required = false) CancelInvoiceRequest request) {
        return accountantInvoiceService.cancel(id, request);
    }
}
