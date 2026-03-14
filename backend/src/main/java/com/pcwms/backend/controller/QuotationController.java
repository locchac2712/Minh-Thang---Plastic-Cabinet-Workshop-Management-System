package com.pcwms.backend.controller;

import com.pcwms.backend.dto.request.QuotationRequest;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.entity.Quotation;
import com.pcwms.backend.services.QuotationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/quotations")
public class QuotationController {

    @Autowired
    private QuotationService quotationService;

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES_MANAGER') or hasRole('DIRECTOR')")
    public ResponseEntity<ResponseObject> createQuotation(@RequestBody QuotationRequest request) {
        try {
            Quotation savedQuotation = quotationService.createQuotation(request);
            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Tạo Báo giá thành công!", savedQuotation)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }
}