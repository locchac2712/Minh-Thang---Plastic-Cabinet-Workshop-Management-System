package com.pcwms.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StockCountResponse {
    private Long id;
    private String countNumber;
    private WarehouseResponse warehouse;
    private LocalDate countDate;
    private String status;
    private String notes;
    private String createdBy;
    private LocalDateTime createdAt;
    private List<StockCountDetailResponse> items;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class WarehouseResponse {
        private Long id;
        private String name;
    }
}
