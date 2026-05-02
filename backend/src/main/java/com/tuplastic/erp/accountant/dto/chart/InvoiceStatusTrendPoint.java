package com.tuplastic.erp.accountant.dto.chart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceStatusTrendPoint {
    private LocalDate bucket;
    private long draft;
    private long issued;
    private long canceled;
    private BigDecimal totalAmountIssued;
}
