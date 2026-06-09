package com.tuplastic.erp.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionOrderQueueItemDto {

    private UUID orderId;
    private String orderDisplayCode;
    private String agencyName;
    private LocalDate expectedDeliveryDate;
    private LocalDateTime createdAt;
    private long taskCount;
    private int remainingBatchableTotal;
    private boolean hasPendingBatch;
}
