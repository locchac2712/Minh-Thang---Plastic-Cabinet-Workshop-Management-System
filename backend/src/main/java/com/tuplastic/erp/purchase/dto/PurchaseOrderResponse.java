package com.tuplastic.erp.purchase.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderResponse {

    private UUID id;
    private UUID supplierId;
    private String supplierName;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private String paymentStatus;
    private String status;
    private List<PurchaseOrderItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
