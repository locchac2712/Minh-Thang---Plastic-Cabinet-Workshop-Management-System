package com.tuplastic.erp.director.controller;

import com.tuplastic.erp.common.dto.chart.BucketPoint;
import com.tuplastic.erp.common.dto.chart.ChartGranularity;
import com.tuplastic.erp.common.dto.chart.NamedValuePoint;
import com.tuplastic.erp.director.dto.chart.GrossMarginTrendPoint;
import com.tuplastic.erp.director.service.DirectorChartService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/director/dashboard/charts")
@PreAuthorize("hasRole('DIRECTOR')")
@RequiredArgsConstructor
public class DirectorChartController {

    private final DirectorChartService directorChartService;

    @GetMapping("/revenue-trend")
    public List<BucketPoint> getRevenueTrend(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) ChartGranularity granularity) {
        return directorChartService.getRevenueTrend(fromDate, toDate, granularity);
    }

    @GetMapping("/order-status-breakdown")
    public List<NamedValuePoint> getOrderStatusBreakdown(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return directorChartService.getOrderStatusBreakdown(fromDate, toDate);
    }

    @GetMapping("/gross-margin-trend")
    public List<GrossMarginTrendPoint> getGrossMarginTrend(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) ChartGranularity granularity) {
        return directorChartService.getGrossMarginTrend(fromDate, toDate, granularity);
    }

    @GetMapping("/top-agencies-revenue")
    public List<NamedValuePoint> getTopAgenciesRevenue(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        return directorChartService.getTopAgenciesRevenue(fromDate, toDate, limit);
    }

    @GetMapping("/cash-collection-trend")
    public List<BucketPoint> getCashCollectionTrend(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) ChartGranularity granularity) {
        return directorChartService.getCashCollectionTrend(fromDate, toDate, granularity);
    }
}
