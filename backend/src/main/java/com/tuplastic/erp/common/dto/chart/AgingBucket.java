package com.tuplastic.erp.common.dto.chart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Một bucket aging (vd 0-30, 31-60, 61-90, &gt;90 ngày).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgingBucket {
    private String range;
    private BigDecimal amount;
    private Long count;
}
