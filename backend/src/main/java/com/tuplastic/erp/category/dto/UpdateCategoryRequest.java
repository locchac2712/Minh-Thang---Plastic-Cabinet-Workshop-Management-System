package com.tuplastic.erp.category.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateCategoryRequest {

    @Size(max = 255, message = "Tên danh mục không được vượt quá 255 ký tự")
    private String name;

    private String description;

    private String imageUrl;

    private Boolean isActive;
}
