package com.tuplastic.erp.product.dto;

import com.tuplastic.erp.bom.dto.CreateBomItemRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class CreateProductRequest {

    @NotNull(message = "Danh mục không được để trống")
    private UUID categoryId;

    @NotBlank(message = "Mã sản phẩm không được để trống")
    @Size(max = 100, message = "Mã sản phẩm không được vượt quá 100 ký tự")
    private String sku;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255, message = "Tên sản phẩm không được vượt quá 255 ký tự")
    private String name;

    private List<String> imageUrls;

    @NotNull(message = "Giá vốn không được để trống")
    private BigDecimal costPrice;

    @NotNull(message = "Giá bán đề xuất không được để trống")
    private BigDecimal suggestedPrice;

    /**
     * Định mức BOM tùy chọn — bỏ trống, null hoặc [] đều được (cập nhật sau qua PUT /api/admin/products/{id}/bom).
     * Nếu có phần tử, schema giống custom: materialId, quantity ({@code > 0}), note.
     */
    @Valid
    private List<CreateBomItemRequest> bomItems;
}
