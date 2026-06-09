package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.agency.dto.AgencyResponse;
import com.tuplastic.erp.agency.service.AgencyService;
import com.tuplastic.erp.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/production/agencies")
@PreAuthorize("hasRole('PRODUCTION')")
@RequiredArgsConstructor
public class ProductionAgencyController {

    private final AgencyService agencyService;

    /** Danh sách đại lý cho form SP custom — tìm tên / MST (read-only). */
    @GetMapping
    public PageResponse<AgencyResponse> listAgencies(
            @RequestParam(name = "is_active", required = false) Boolean isActive,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return agencyService.getAllAgencies(null, isActive, search, page, size);
    }
}
