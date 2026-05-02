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
public class EligibleOrderForInvoiceResponse {

    private UUID id;
    private UUID agencyId;
    private String agencyName;
    private BigDecimal totalPayable;
    private BigDecimal paidAmount;
    private String status;
    private LocalDateTime createdAt;
}
