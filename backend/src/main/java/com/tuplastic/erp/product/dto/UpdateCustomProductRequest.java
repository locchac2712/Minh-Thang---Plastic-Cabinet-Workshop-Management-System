package com.tuplastic.erp.product.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class UpdateCustomProductRequest {

    @NotNull(message = "Đại lý không được để trống")
    private UUID agencyId;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    private List<String> imageUrls;

    private String resourceUrl;

    private BigDecimal costPrice;

    @NotNull(message = "Giá đề xuất không được để trống")
    private BigDecimal suggestedPrice;

    @NotEmpty(message = "BOM phải có ít nhất 1 dòng vật tư")
    @Valid
    private List<CreateCustomProductBomLineRequest> bomItems;
}
