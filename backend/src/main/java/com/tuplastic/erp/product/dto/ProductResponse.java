package com.tuplastic.erp.product.dto;

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
public class ProductResponse {

    private UUID id;
    private UUID categoryId;
    private String categoryName;
    private String sku;
    private String name;
    private List<String> imageUrls;
    private BigDecimal costPrice;
    private BigDecimal suggestedPrice;
    private Integer stockQuantity;
    private Boolean isActive;
    private Boolean isCustom;
    private UUID agencyId;
    private UUID createdById;
    private String resourceUrl;
    private LocalDateTime createdAt;
}
