package com.tuplastic.erp.director.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectorOrderWasteSummaryResponse {

    private UUID orderId;
    private BigDecimal estimatedDamageVnd;
    private long wasteEventCount;
    private BigDecimal discardedBoardEquivalent;
    private List<DirectorWasteMaterialRow> materialRows;
    private List<DirectorOrderWasteEventRow> events;
}
