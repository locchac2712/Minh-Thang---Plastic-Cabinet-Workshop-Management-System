package com.tuplastic.erp.director.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrossMarginReport {

    private BigDecimal totalRevenue;
    private BigDecimal totalCost;
    private BigDecimal grossMargin;
    private BigDecimal marginPercent;
    private Long orderCount;
}
