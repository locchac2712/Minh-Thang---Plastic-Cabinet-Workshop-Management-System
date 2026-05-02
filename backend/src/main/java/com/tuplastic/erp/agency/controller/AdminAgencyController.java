package com.tuplastic.erp.agency.controller;

import com.tuplastic.erp.agency.dto.AdminCreateAgencyRequest;
import com.tuplastic.erp.agency.dto.AgencyResponse;
import com.tuplastic.erp.agency.dto.TransferOwnerRequest;
import com.tuplastic.erp.agency.dto.UpdateAgencyRequest;
import com.tuplastic.erp.agency.service.AgencyService;
import com.tuplastic.erp.common.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/agencies")
@PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR')")
@RequiredArgsConstructor
public class AdminAgencyController {

    private final AgencyService agencyService;

    @GetMapping
    public PageResponse<AgencyResponse> getAllAgencies(
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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AgencyResponse createAgency(@Valid @RequestBody AdminCreateAgencyRequest request) {
        return agencyService.createAgencyForAdmin(request);
    }

    @PatchMapping("/{id}")
    public AgencyResponse updateAgency(@PathVariable UUID id,
                                       @Valid @RequestBody UpdateAgencyRequest request) {
        return agencyService.updateAgency(id, request);
    }

    @PatchMapping("/{id}/transfer-owner")
    public AgencyResponse transferOwner(@PathVariable UUID id,
                                        @Valid @RequestBody TransferOwnerRequest request) {
        return agencyService.transferOwner(id, request);
    }

    @PatchMapping("/{id}/toggle-active")
    public AgencyResponse toggleActive(@PathVariable UUID id) {
        return agencyService.toggleActive(id);
    }
}
