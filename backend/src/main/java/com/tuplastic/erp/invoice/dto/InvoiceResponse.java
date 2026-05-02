package com.tuplastic.erp.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {

    private UUID id;
    private UUID orderId;
    private String invoiceNumber;
    private BigDecimal subTotal;
    private BigDecimal vatRate;
    private BigDecimal vatAmount;
    private BigDecimal totalAmount;
    private String invoiceFileUrl;
    private String status;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
