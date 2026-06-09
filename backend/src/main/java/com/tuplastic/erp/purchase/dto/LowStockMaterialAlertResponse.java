package com.tuplastic.erp.purchase.dto;

import com.tuplastic.erp.material.dto.MaterialSupplierItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LowStockMaterialAlertResponse {

    private UUID id;
    private String code;
    private String name;
    private String unit;
    private BigDecimal stockQuantity;
    private BigDecimal minStockLevel;
    /** NCC đã liên kết vật tư (`material_supplier`), sắp theo tên. */
    private List<MaterialSupplierItem> suppliers;
}
