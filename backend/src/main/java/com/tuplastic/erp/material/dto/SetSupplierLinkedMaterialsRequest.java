package com.tuplastic.erp.material.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/** Thay toàn bộ tập vật tư gắn với NCC: `materialIds` rỗng = bỏ hết liên kết. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetSupplierLinkedMaterialsRequest {

    private List<UUID> materialIds;
}
