package com.tuplastic.erp.material.dto;

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
public class MaterialResponse {

    private UUID id;
    private String code;
    private String name;
    private String imageUrl;
    private String unit;
    private BigDecimal unitCost;
    private BigDecimal stockQuantity;
    private BigDecimal minStockLevel;
    private Boolean isActive;
    private LocalDateTime createdAt;
    /**
     * Danh sách NCC liên kết — chỉ điền đủ ở {@code GET .../materials/{id}} (chi tiết).
     * Ở phân trang, field này thường null.
     */
    private List<MaterialSupplierItem> linkedSuppliers;
    /**
     * Số NCC liên kết — luôn gửi ở list + detail.
     */
    private Long linkedSupplierCount;
}
