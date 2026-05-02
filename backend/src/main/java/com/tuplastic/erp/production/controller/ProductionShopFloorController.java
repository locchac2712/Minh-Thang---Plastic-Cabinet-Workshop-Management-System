package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.production.dto.ShopFloorPerformanceReport;
import com.tuplastic.erp.production.service.ShopFloorPerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/production/reports/shop-floor")
@PreAuthorize("hasRole('PRODUCTION')")
@RequiredArgsConstructor
public class ProductionShopFloorController {

    private final ShopFloorPerformanceService shopFloorPerformanceService;

    @GetMapping
    public ShopFloorPerformanceReport getReport(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return shopFloorPerformanceService.getReport(fromDate, toDate);
    }
}
