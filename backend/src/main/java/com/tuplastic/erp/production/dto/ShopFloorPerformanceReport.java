package com.tuplastic.erp.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopFloorPerformanceReport {

    private LocalDate fromDate;
    private LocalDate toDate;
    private ShopFloorKpiSummary kpi;
    private WipSnapshot wip;
    private List<ShopFloorThroughputItem> throughputByMonth;
    private List<ShopFloorAssigneeStats> byAssignee;
}
