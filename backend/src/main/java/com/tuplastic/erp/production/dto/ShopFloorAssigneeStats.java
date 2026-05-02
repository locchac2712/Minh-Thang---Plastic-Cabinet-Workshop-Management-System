package com.tuplastic.erp.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/** Thống kê theo công nhân, task Done hoàn thành trong kỳ. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopFloorAssigneeStats {

    private UUID userId;
    private String fullName;
    private long doneCount;
    private long withExpectedCount;
    private long onTimeCount;
    private BigDecimal onTimePercent;
    private int totalDoneQuantity;
}
