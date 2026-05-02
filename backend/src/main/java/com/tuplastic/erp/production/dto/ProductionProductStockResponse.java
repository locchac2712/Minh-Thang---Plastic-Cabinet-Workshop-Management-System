package com.tuplastic.erp.production.dto;

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
public class ProductionProductStockResponse {

    private UUID id;
    private UUID categoryId;
    private String categoryName;
    private String sku;
    private String name;
    private List<String> imageUrls;
    private Integer stockQuantity;
    private Boolean isActive;
}
