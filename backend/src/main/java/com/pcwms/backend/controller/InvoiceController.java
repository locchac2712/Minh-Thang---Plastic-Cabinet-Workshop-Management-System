package com.pcwms.backend.controller;

import com.pcwms.backend.services.InvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    /**
     * GET /api/invoices/sales-order/{salesOrderId}
     *   ?paymentType=FULL|DEPOSIT   (bat buoc, mac dinh FULL)
     * Tao hoa don GTGT PDF kem ma QR PayOS
     */
    @GetMapping("/sales-order/{salesOrderId}")
//    @PreAuthorize("hasAnyRole('SALES_STAFF', 'ADMIN', 'DIRECTOR')")
    public ResponseEntity<byte[]> exportInvoice(
            @PathVariable Long salesOrderId,
            @RequestParam(defaultValue = "FULL") String paymentType,
            @RequestParam(required = false)      Long   amount) {
        try {
            byte[] pdf      = invoiceService.generateInvoicePdf(salesOrderId, paymentType, amount);
            String filename = "HoaDon_" + salesOrderId + ".pdf";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdf.length)
                    .body(pdf);

        } catch (Exception e) {
            log.error("Export invoice failed | salesOrderId={}: {}", salesOrderId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}