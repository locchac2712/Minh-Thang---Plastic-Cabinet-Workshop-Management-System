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
public class DirectorWasteSummaryResponse {

    private BigDecimal estimatedDamageVnd;
    private long wasteEventCount;
    /** Tổng SL (đơn vị tồn) các NVL có đơn vị quy ước là tấm — MVP */
    private BigDecimal discardedBoardEquivalent;
    private long teamsNeedingActionCount;
}
