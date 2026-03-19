package com.pcwms.backend.controller;

import com.pcwms.backend.dto.PaymentDTO;
import com.pcwms.backend.services.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments/payos")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('SALES_STAFF', 'ADMIN', 'DIRECTOR')")
    public ResponseEntity<PaymentDTO.CreatePayOSResponse> create(
            @RequestBody PaymentDTO.CreatePayOSRequest request) {
        try {
            return ResponseEntity.ok(paymentService.createPaymentLink(request));
        } catch (Exception e) {
            log.error("Create PayOS link failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/status/{paymentLinkId}")
    @PreAuthorize("hasAnyRole('SALES_STAFF', 'ADMIN', 'DIRECTOR')")
    public ResponseEntity<PaymentDTO.StatusResponse> status(
            @PathVariable String paymentLinkId) {
        try {
            return ResponseEntity.ok(paymentService.getPaymentStatus(paymentLinkId));
        } catch (Exception e) {
            log.error("Get status failed for {}: {}", paymentLinkId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/cancel/{paymentLinkId}")
    @PreAuthorize("hasAnyRole('SALES_STAFF', 'ADMIN', 'DIRECTOR')")
    public ResponseEntity<Void> cancel(
            @PathVariable String paymentLinkId) {
        try {
            paymentService.cancelPaymentLink(paymentLinkId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Cancel failed for {}: {}", paymentLinkId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // PayOS gọi vào đây — không cần JWT
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> webhook(
            @RequestBody PaymentDTO.WebhookPayload payload) {
        try {
            paymentService.handleWebhook(payload);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            log.error("Webhook error: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }
}