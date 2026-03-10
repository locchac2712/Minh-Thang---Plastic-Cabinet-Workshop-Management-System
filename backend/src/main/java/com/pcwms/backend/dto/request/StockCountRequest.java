package com.pcwms.backend.dto.request;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class StockCountRequest {
    private Long warehouseId;
    private LocalDate countDate;
    private String notes;
    private String status;
    private List<StockCountDetailRequest> items;
}
