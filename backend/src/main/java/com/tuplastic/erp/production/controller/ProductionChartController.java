package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.common.dto.chart.BucketPoint;
import com.tuplastic.erp.common.dto.chart.ChartGranularity;
import com.tuplastic.erp.common.dto.chart.NamedValuePoint;
import com.tuplastic.erp.production.dto.chart.MaterialConsumptionTrend;
import com.tuplastic.erp.production.service.ProductionChartService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/production/dashboard/charts")
@PreAuthorize("hasRole('PRODUCTION')")
@RequiredArgsConstructor
public class ProductionChartController {

    private final ProductionChartService productionChartService;

    @GetMapping("/task-completion-trend")
    public List<BucketPoint> getTaskCompletionTrend(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) ChartGranularity granularity) {
        return productionChartService.getTaskCompletionTrend(fromDate, toDate, granularity);
    }

    @GetMapping("/task-status-breakdown")
    public List<NamedValuePoint> getTaskStatusBreakdown() {
        return productionChartService.getTaskStatusBreakdown();
    }

    @GetMapping("/top-workers-throughput")
    public List<NamedValuePoint> getTopWorkersThroughput(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        return productionChartService.getTopWorkersThroughput(fromDate, toDate, limit);
    }

    @GetMapping("/material-consumption-trend")
    public MaterialConsumptionTrend getMaterialConsumptionTrend(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) ChartGranularity granularity,
            @RequestParam(name = "top", defaultValue = "5") int top) {
        return productionChartService.getMaterialConsumptionTrend(fromDate, toDate, granularity, top);
    }

    @GetMapping("/late-task-trend")
    public List<BucketPoint> getLateTaskTrend(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) ChartGranularity granularity) {
        return productionChartService.getLateTaskTrend(fromDate, toDate, granularity);
    }
}
