package com.tuplastic.erp.production.dto;

import com.tuplastic.erp.order.dto.OrderItemResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {

    private UUID id;
    private UUID orderId;
    private String orderAgencyName;
    private Boolean productIsCustom;
    private String productResourceUrl;
    private UUID productId;
    private String productName;
    private Integer quantity;
    private UUID assignedToId;
    private String assignedToName;
    private String status;
    private LocalDate startDate;
    private LocalDate expectedEndDate;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> orderItems;
    private List<BomItemDetail> bomItems;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BomItemDetail {
        private UUID materialId;
        private String materialName;
        private String materialCode;
        private String unit;
        private java.math.BigDecimal quantityPerUnit;
    }
}
