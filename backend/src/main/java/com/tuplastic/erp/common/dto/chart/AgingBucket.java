package com.tuplastic.erp.common.dto.chart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Một bucket aging cho chart Kế toán. {@link #range} là nhãn tiếng Việt (vd. {@code 0–30 ngày}).
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
