package com.tuplastic.erp.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderFulfillmentSummaryDto {

    private UUID orderId;
    private String status;
    private List<FulfillmentLineDto> lines;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FulfillmentLineDto {
        private UUID orderItemId;
        private UUID productId;
        private String productName;
        private Integer orderedQuantity;
        private Integer batchedQuantity;
        private Integer deliveredQuantity;
        private Integer remainingToBatch;
        private Integer remainingToDeliver;
    }
}
