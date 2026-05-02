package com.tuplastic.erp.product.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class UpdateProductRequest {

    @Size(max = 255, message = "Tên sản phẩm không được vượt quá 255 ký tự")
    private String name;

    private List<String> imageUrls;

    private BigDecimal costPrice;

    private BigDecimal suggestedPrice;
}
