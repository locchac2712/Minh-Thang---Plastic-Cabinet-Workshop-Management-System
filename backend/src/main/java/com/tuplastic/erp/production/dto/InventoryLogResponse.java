package com.tuplastic.erp.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryLogResponse {

    private UUID id;
    private UUID materialId;
    private String materialName;
    private UUID taskId;
    /** Ghi nhận từ đơn mua hàng (nhập kho NVL), có thể null */
    private UUID purchaseId;
    private String createdByName;
    private String transactionType;
    private BigDecimal quantityChange;
    private BigDecimal unitPriceAtTime;
    private String note;
    private LocalDateTime createdAt;
}
