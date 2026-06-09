package com.tuplastic.erp.order.controller;

import com.tuplastic.erp.common.dto.chart.BucketPoint;
import com.tuplastic.erp.common.dto.chart.ChartGranularity;
import com.tuplastic.erp.common.dto.chart.NamedValuePoint;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.order.dto.chart.AgencyDebtRiskPoint;
import com.tuplastic.erp.order.dto.chart.SellerOpenOrdersCountResponse;
import com.tuplastic.erp.order.service.SellerChartService;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/seller/dashboard/charts")
@PreAuthorize("hasRole('SELLER')")
@RequiredArgsConstructor
public class SellerChartController {

    private final SellerChartService sellerChartService;
    private final SecurityUtils securityUtils;

    @GetMapping("/my-revenue-trend")
    public List<BucketPoint> getMyRevenueTrend(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) ChartGranularity granularity) {
        User me = securityUtils.getCurrentUser();
        return sellerChartService.getMyRevenueTrend(me, fromDate, toDate, granularity);
    }

    @GetMapping("/my-order-status-breakdown")
    public List<NamedValuePoint> getMyOrderStatusBreakdown(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        User me = securityUtils.getCurrentUser();
        return sellerChartService.getMyOrderStatusBreakdown(me, fromDate, toDate);
    }

    @GetMapping("/my-pipeline-funnel")
    public List<NamedValuePoint> getMyPipelineFunnel() {
        User me = securityUtils.getCurrentUser();
        return sellerChartService.getMyPipelineFunnel(me);
    }

    @GetMapping("/my-open-orders-count")
    public SellerOpenOrdersCountResponse getMyOpenOrdersCount() {
        User me = securityUtils.getCurrentUser();
        return sellerChartService.getMyOpenOrdersCount(me);
    }

    @GetMapping("/my-top-agencies")
    public List<NamedValuePoint> getMyTopAgencies(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        User me = securityUtils.getCurrentUser();
        return sellerChartService.getMyTopAgencies(me, fromDate, toDate, limit);
    }

    @GetMapping("/my-agency-debt-risk")
    public List<AgencyDebtRiskPoint> getMyAgencyDebtRisk() {
        User me = securityUtils.getCurrentUser();
        return sellerChartService.getMyAgencyDebtRisk(me);
    }
}
