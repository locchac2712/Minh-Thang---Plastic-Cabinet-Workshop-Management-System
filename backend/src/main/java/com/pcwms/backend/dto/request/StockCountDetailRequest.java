package com.pcwms.backend.dto.request;

import lombok.Data;

@Data
public class StockCountDetailRequest {
    private Long id;
    private Long materialId;
    private Integer systemQuantity;
    private Integer actualQuantity;
    private Integer difference;
    private String notes;
}
