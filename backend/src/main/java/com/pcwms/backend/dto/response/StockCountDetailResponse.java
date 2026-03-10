package com.pcwms.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StockCountDetailResponse {
    private Long id;
    private Long materialId;
    private String materialName;
    private String materialSku;
    private Integer systemQuantity;
    private Integer actualQuantity;
    private Integer difference;
    private String notes;
}
