package com.tuplastic.erp.productinventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductInventoryLogResponse {

    private UUID id;
    private UUID productId;
    private String productName;
    private String productSku;
    private UUID orderId;
    private UUID taskId;
    private String createdByName;
    private String transactionType;
    private Integer quantityChange;
    private String note;
    private LocalDateTime createdAt;
}
