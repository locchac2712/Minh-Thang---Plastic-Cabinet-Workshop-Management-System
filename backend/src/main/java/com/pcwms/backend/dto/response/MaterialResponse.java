package com.pcwms.backend.dto.response;

import com.pcwms.backend.entity.Material;
import lombok.Data;
import java.util.stream.Collectors;

@Data
public class MaterialResponse {
    // 6 trường chính xác theo UI của bạn yêu cầu:
    private String sku;
    private String materialName;
    private String unit;
    private String supplier; // 👉 Thêm mới để hứng tên Nhà cung cấp
    private Integer minStockLevel;
    private String description;

    // (Giữ lại các trường này nếu sau này Frontend cần dùng để tính toán)
    private Long id;
    private Integer currentStock;
    private boolean isLowStock;

    public MaterialResponse(Material m) {
        this.id = m.getId();
        this.sku = m.getSku();
        this.materialName = m.getName(); // Đổi tên biến cho sát UI
        this.unit = m.getUnit();
        this.minStockLevel = m.getMinStockLevel() != null ? m.getMinStockLevel() : 0;
        this.description = m.getDescription();
        this.currentStock = m.getCurrentStock() != null ? m.getCurrentStock() : 0;
        this.isLowStock = this.currentStock <= this.minStockLevel;

        // 👉 Logic gom tên Nhà cung cấp thực tế từ Database
        if (m.getSupplierMaterials() != null && !m.getSupplierMaterials().isEmpty()) {
            this.supplier = m.getSupplierMaterials().stream()
                    .map(sm -> sm.getSupplier().getName()) // Map chính xác tên biến của bạn luôn
                    .collect(Collectors.joining(", "));
        } else {
            this.supplier = "Chưa có nhà cung cấp";
        }
    }
}