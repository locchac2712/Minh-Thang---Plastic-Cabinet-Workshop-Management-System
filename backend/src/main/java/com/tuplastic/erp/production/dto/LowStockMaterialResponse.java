package com.tuplastic.erp.production.dto;

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
public class LowStockMaterialResponse {

    private UUID id;
    private String code;
    private String name;
    private String unit;
    private BigDecimal stockQuantity;
    private BigDecimal minStockLevel;
}
