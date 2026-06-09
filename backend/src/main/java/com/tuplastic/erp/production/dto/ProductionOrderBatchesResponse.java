package com.tuplastic.erp.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionOrderBatchesResponse {

    private UUID orderId;
    private LocalDate expectedDeliveryDate;
    private List<TaskResponse> batches;
    private List<OrderItemBatchRemainingDto> remainingByItem;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemBatchRemainingDto {
        private UUID orderItemId;
        private UUID productId;
        private String productName;
        private Integer orderedQuantity;
        private Integer batchedQuantity;
        private Integer remainingBatchable;
    }
}
