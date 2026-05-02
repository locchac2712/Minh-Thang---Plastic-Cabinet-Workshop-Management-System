package com.tuplastic.erp.purchase.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Nhu cầu NVL từ lệnh SX mở (Waiting/Doing) × BOM; ước tính thiếu so tồn tĩnh.
 * Không trừ PO chưa nhận; có thể bổ sung sau.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpenTaskMaterialNeedItem {

    private UUID materialId;
    private String materialCode;
    private String materialName;
    private String unit;
    private BigDecimal requiredForOpenTasks;
    private BigDecimal stockQuantity;
    private BigDecimal minStockLevel;
    private BigDecimal suggestedOrderQuantity;
}
