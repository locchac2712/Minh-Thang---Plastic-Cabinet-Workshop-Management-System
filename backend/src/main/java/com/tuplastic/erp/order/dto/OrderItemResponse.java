package com.tuplastic.erp.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {

    private UUID id;
    private UUID productId;
    private String productName;
    private String productSku;
    private Boolean isCustom;
    private String resourceUrl;
    private Integer quantity;
    private Integer deliveredQuantity;
    private Integer remainingToDeliver;
    private BigDecimal unitPrice;
    private BigDecimal unitCostAtTime;
    private BigDecimal subtotal;
}
