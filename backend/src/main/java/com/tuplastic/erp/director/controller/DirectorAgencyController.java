package com.tuplastic.erp.director.controller;

import com.tuplastic.erp.agency.dto.AgencyResponse;
import com.tuplastic.erp.agency.service.AgencyService;
import com.tuplastic.erp.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Danh sách đại lý (hạn mức nợ, nợ hiện tại) cho Giám đốc — read-only; chỉnh hạn mức dùng
 * {@code PATCH /api/director/approvals/agencies/{id}/override-debt}.
 */
@RestController
@RequestMapping("/api/director/agencies")
@PreAuthorize("hasRole('DIRECTOR')")
@RequiredArgsConstructor
public class DirectorAgencyController {

    private final AgencyService agencyService;

    @GetMapping
    public PageResponse<AgencyResponse> listAgencies(
            @RequestParam(required = false) String level,
            @RequestParam(name = "is_active", required = false) Boolean isActive,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return agencyService.getAllAgencies(level, isActive, search, page, size);
    }

    @GetMapping("/{id}")
    public AgencyResponse getAgency(@PathVariable UUID id) {
        return agencyService.getAgencyByIdForAdmin(id);
    }
}
