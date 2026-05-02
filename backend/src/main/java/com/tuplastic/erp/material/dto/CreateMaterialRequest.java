package com.tuplastic.erp.material.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class CreateMaterialRequest {

    @NotBlank(message = "Mã vật tư không được để trống")
    @Size(max = 100, message = "Mã vật tư không được vượt quá 100 ký tự")
    private String code;

    @NotBlank(message = "Tên vật tư không được để trống")
    @Size(max = 255, message = "Tên vật tư không được vượt quá 255 ký tự")
    private String name;

    private String imageUrl;

    @NotBlank(message = "Đơn vị tính không được để trống")
    @Size(max = 50, message = "Đơn vị tính không được vượt quá 50 ký tự")
    private String unit;

    private BigDecimal minStockLevel;

    /** Tùy chọn — danh sách NCC cung cấp vật tư này (M–N). Rỗng = không gán. */
    private List<UUID> supplierIds;
}
