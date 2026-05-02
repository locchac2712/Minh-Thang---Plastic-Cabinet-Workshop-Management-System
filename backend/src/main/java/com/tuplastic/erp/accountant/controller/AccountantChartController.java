package com.tuplastic.erp.accountant.controller;

import com.tuplastic.erp.accountant.dto.chart.CashFlowTrendPoint;
import com.tuplastic.erp.accountant.dto.chart.InvoiceStatusTrendPoint;
import com.tuplastic.erp.accountant.service.AccountantChartService;
import com.tuplastic.erp.common.dto.chart.AgingBucket;
import com.tuplastic.erp.common.dto.chart.ChartGranularity;
import com.tuplastic.erp.common.dto.chart.NamedValuePoint;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/accountant/dashboard/charts")
@PreAuthorize("hasRole('ACCOUNTANT')")
@RequiredArgsConstructor
public class AccountantChartController {

    private final AccountantChartService accountantChartService;

    @GetMapping("/cash-flow-trend")
    public List<CashFlowTrendPoint> getCashFlowTrend(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) ChartGranularity granularity) {
        return accountantChartService.getCashFlowTrend(fromDate, toDate, granularity);
    }

    @GetMapping("/receivables-aging")
    public List<AgingBucket> getReceivablesAging() {
        return accountantChartService.getReceivablesAging();
    }

    @GetMapping("/payables-aging")
    public List<AgingBucket> getPayablesAging() {
        return accountantChartService.getPayablesAging();
    }

    @GetMapping("/invoice-status-trend")
    public List<InvoiceStatusTrendPoint> getInvoiceStatusTrend(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) ChartGranularity granularity) {
        return accountantChartService.getInvoiceStatusTrend(fromDate, toDate, granularity);
    }

    @GetMapping("/top-suppliers-debt")
    public List<NamedValuePoint> getTopSuppliersDebt(
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        return accountantChartService.getTopSuppliersDebt(limit);
    }
}
