package com.tuplastic.erp.director.controller;

import com.tuplastic.erp.director.dto.DirectorDashboardResponse;
import com.tuplastic.erp.director.service.DirectorDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/director/dashboard")
@PreAuthorize("hasRole('DIRECTOR')")
@RequiredArgsConstructor
public class DirectorDashboardController {

    private final DirectorDashboardService directorDashboardService;

    @GetMapping
    public DirectorDashboardResponse getDashboard(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return directorDashboardService.getDashboard(fromDate, toDate);
    }
}
