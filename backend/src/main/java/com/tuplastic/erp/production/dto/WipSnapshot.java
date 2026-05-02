package com.tuplastic.erp.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Tồn kho tại bàn: trạng thái lệnh hiện tại, không theo kỳ hoàn thành.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WipSnapshot {

    private long waitingCount;
    private long doingCount;
    private int waitingTotalQuantity;
    private int doingTotalQuantity;
    /** Optional: từ {@link com.tuplastic.erp.production.service.ProductionTaskService#getTaskCountByStatus} */
    private Map<String, Long> countByStatus;
}
