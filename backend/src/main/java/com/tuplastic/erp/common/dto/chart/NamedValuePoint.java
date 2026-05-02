package com.tuplastic.erp.common.dto.chart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Cặp nhãn — giá trị (cho donut, top N, breakdown). FE vẽ Donut/Pie/Horizontal-bar.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NamedValuePoint {
    private String name;
    private BigDecimal value;
    private Long count;
}
