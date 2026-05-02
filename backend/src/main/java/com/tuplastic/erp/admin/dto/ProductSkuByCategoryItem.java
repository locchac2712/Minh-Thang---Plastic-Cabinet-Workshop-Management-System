package com.tuplastic.erp.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Một cột biểu đồ "mẫu tủ / SKU theo ngành hàng": số sản phẩm mẫu (catalog) trong danh mục.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSkuByCategoryItem {

    private UUID categoryId;
    private String categoryName;
    private long skuCount;
}
