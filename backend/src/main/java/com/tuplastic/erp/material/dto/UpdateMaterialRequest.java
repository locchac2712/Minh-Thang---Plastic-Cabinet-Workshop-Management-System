package com.tuplastic.erp.material.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class UpdateMaterialRequest {

    @Size(max = 255, message = "Tên vật tư không được vượt quá 255 ký tự")
    private String name;

    private String imageUrl;

    @Size(max = 50, message = "Đơn vị tính không được vượt quá 50 ký tự")
    private String unit;

    private BigDecimal minStockLevel;

    private Boolean isActive;

    /**
     * Nếu gửi (không null): thay toàn bộ tập NCC liên kết. Rỗng = xóa hết NCC.
     * null = giữ nguyên liên kết hiện tại.
     */
    private List<UUID> supplierIds;
}
