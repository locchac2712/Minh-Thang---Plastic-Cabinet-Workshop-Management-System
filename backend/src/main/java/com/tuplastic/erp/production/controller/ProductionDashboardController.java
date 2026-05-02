package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.production.dto.ProductionDashboardResponse;
import com.tuplastic.erp.production.service.ProductionDashboardService;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/production/dashboard")
@PreAuthorize("hasRole('PRODUCTION')")
@RequiredArgsConstructor
public class ProductionDashboardController {

    private final ProductionDashboardService productionDashboardService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ProductionDashboardResponse getDashboard() {
        User user = securityUtils.getCurrentUser();
        return productionDashboardService.getDashboard(user);
    }
}
