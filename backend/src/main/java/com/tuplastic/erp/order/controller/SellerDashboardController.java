package com.tuplastic.erp.order.controller;

import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.order.dto.SellerDashboardResponse;
import com.tuplastic.erp.order.service.SellerDashboardService;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/seller/dashboard")
@PreAuthorize("hasRole('SELLER')")
@RequiredArgsConstructor
public class SellerDashboardController {

    private final SellerDashboardService sellerDashboardService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public SellerDashboardResponse getDashboard(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        User seller = securityUtils.getCurrentUser();
        return sellerDashboardService.getDashboard(seller, fromDate, toDate);
    }
}
