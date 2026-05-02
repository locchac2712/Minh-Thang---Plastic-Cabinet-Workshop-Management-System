package com.tuplastic.erp.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionDashboardResponse {

    private Map<String, Long> taskCountByStatus;
    private long lowStockMaterialCount;
    private List<TaskResponse> myOpenTasks;
    /** On-time, WIP: xem thêm field shopFloor; full report: GET /api/production/reports/shop-floor */
    private ShopFloorKpiSummary shopFloorKpiLast30Days;
}
