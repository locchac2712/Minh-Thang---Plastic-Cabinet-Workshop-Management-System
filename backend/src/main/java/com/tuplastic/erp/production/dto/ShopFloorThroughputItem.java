package com.tuplastic.erp.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** Tổng quantity hoàn thành theo kỳ (tháng). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopFloorThroughputItem {

    private String period;
    private long doneTaskCount;
    private BigDecimal totalQuantity;
}
