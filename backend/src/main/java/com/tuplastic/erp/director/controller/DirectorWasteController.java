package com.tuplastic.erp.director.controller;

import com.tuplastic.erp.director.dto.*;
import com.tuplastic.erp.director.enums.WasteSeverity;
import com.tuplastic.erp.director.service.DirectorWasteService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/director/waste")
@PreAuthorize("hasRole('DIRECTOR')")
@RequiredArgsConstructor
public class DirectorWasteController {

    private final DirectorWasteService directorWasteService;

    @GetMapping("/summary")
    public DirectorWasteSummaryResponse getSummary(
            @RequestParam(name = "from_date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return directorWasteService.getSummary(fromDate, toDate);
    }

    @GetMapping("/teams")
    public List<DirectorWasteTeamRow> getTeams(
            @RequestParam(name = "from_date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) WasteSeverity severity,
            @RequestParam(required = false) String search) {
        return directorWasteService.getTeams(fromDate, toDate, severity, search);
    }

    @GetMapping("/teams/{teamUserId}/details")
    public DirectorWasteTeamDetailsResponse getTeamDetails(
            @PathVariable UUID teamUserId,
            @RequestParam(name = "from_date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return directorWasteService.getTeamDetails(teamUserId, fromDate, toDate);
    }

    @PutMapping("/teams/{teamUserId}/remark")
    public void saveRemark(
            @PathVariable UUID teamUserId,
            @RequestParam(name = "from_date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestBody DirectorWasteRemarkRequest request) {
        directorWasteService.saveRemark(teamUserId, fromDate, toDate, request);
    }
}
