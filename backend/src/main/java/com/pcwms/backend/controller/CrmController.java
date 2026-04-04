package com.pcwms.backend.controller;

import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.services.CrmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/crm")
public class CrmController {

    @Autowired
    private CrmService crmService;

    @GetMapping("/dashboard/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('SALES_MANAGER') or hasRole('SALES_STAFF')")
    public ResponseEntity<ResponseObject> getDashboardStats(
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Lấy thống kê CRM thành công",
                        crmService.getMonthlyStats(month, year))
        );
    }
}
