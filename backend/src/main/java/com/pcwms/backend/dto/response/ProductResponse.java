package com.pcwms.backend.dto.response;

import com.pcwms.backend.entity.Product;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductResponse {
    private Long id;
    private String name;
    private String sku;
    private BigDecimal sellingPrice;
    private Integer currentStock;
    private String unit;
    private String description;
    private String status;
    private String imageUrl;

    public ProductResponse(Product p) {
        this.id = p.getId();
        this.name = p.getName();
        this.sku = p.getSku();
        this.sellingPrice = p.getSellingPrice();
        this.currentStock = p.getCurrentStock();
        this.unit = p.getUnit();
        this.description = p.getDescription();
        // Chuyển Enum thành String (DRAFT, ACTIVE, DEACTIVATED)
        this.status = p.getStatus() != null ? p.getStatus().name() : "DRAFT";
        this.imageUrl = p.getImageUrl();
    }
}