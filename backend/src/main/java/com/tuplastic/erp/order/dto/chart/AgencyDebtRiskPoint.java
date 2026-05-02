package com.tuplastic.erp.order.dto.chart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgencyDebtRiskPoint {
    private UUID agencyId;
    private String agencyName;
    private BigDecimal totalDebt;
    private BigDecimal maxDebtLimit;
    /** % nợ trên hạn mức, làm tròn 1 chữ số; null nếu hạn mức = 0. */
    private BigDecimal debtRatioPercent;
}
