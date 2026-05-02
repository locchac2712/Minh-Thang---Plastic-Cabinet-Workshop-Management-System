package com.tuplastic.erp.director.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceivableContributingOrderDto {

    private UUID orderId;
    private BigDecimal remainingAmount;
    private LocalDate anchorDate;
    private LocalDate dueDate;
    private int overdueDays;
    private String agingBucket;
}
