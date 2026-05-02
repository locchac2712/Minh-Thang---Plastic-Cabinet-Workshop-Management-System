package com.tuplastic.erp.material.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Kết quả sau khi put đồng bộ: danh sách vật tư còn liên kết với NCC (có thể
 * gọi lại GET nếu cần bản phân trang).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetSupplierLinkedMaterialsResult {

    private List<UUID> materialIds;
    private int linkedCount;
}
