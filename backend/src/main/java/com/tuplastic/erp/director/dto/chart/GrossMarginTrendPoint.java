package com.tuplastic.erp.director.dto.chart;

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
public class GrossMarginTrendPoint {
    private LocalDate bucket;
    private BigDecimal revenue;
    private BigDecimal cost;
    private BigDecimal grossMargin;
    /** % so với revenue, làm tròn 1 chữ số; null nếu revenue = 0. */
    private BigDecimal marginPercent;
}
