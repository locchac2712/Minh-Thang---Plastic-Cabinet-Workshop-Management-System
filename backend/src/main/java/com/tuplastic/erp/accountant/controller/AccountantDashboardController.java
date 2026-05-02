package com.tuplastic.erp.accountant.controller;

import com.tuplastic.erp.accountant.dto.AccountantDashboardResponse;
import com.tuplastic.erp.accountant.service.AccountantDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accountant/dashboard")
@PreAuthorize("hasRole('ACCOUNTANT')")
@RequiredArgsConstructor
public class AccountantDashboardController {

    private final AccountantDashboardService accountantDashboardService;

    @GetMapping
    public AccountantDashboardResponse getDashboard() {
        return accountantDashboardService.getDashboard();
    }
}
