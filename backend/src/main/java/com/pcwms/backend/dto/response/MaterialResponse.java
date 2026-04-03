package com.pcwms.backend.dto.response;

import com.pcwms.backend.entity.Material;
import lombok.Data;
import java.util.stream.Collectors;

@Data
public class MaterialResponse {
    private String sku;
    private String materialName;
    private String unit;
    private String supplier;
    private String materialType;
    private String standardSize;
    private Integer minStockLevel;
    private String description;

    private Long id;
    private Integer currentStock;
    private boolean isLowStock;

    public MaterialResponse(Material m) {
        this.id = m.getId();
        this.sku = m.getSku();
        this.materialName = m.getName();
        this.unit = m.getUnit();
        this.materialType = m.getMaterialType();
        this.standardSize = m.getStandardSize();
        this.minStockLevel = m.getMinStockLevel() != null ? m.getMinStockLevel() : 0;
        this.description = m.getDescription();
        this.currentStock = m.getCurrentStock() != null ? m.getCurrentStock() : 0;
        this.isLowStock = this.currentStock <= this.minStockLevel;

        if (m.getSupplierMaterials() != null && !m.getSupplierMaterials().isEmpty()) {
            this.supplier = m.getSupplierMaterials().stream()
                    .map(sm -> sm.getSupplier().getName())
                    .collect(Collectors.joining(", "));
        } else {
            this.supplier = "Chưa có nhà cung cấp";
        }
    }
}