package com.pcwms.backend.controller;

import com.pcwms.backend.dto.request.BomUpdateRequest;
import com.pcwms.backend.dto.response.BomResponse;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.services.BomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/boms")
public class BomController {

    @Autowired
    private BomService bomService;

    // Xem danh sách BOM
    @GetMapping
    @PreAuthorize("hasRole('PRODUCTION_MANAGER') or hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<ResponseObject> getAllBoms() {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Lấy danh sách Định mức (BOM) thành công", bomService.getAllBoms())
        );
    }
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('PRODUCTION_MANAGER') or hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<ResponseObject> getBomById(@PathVariable Long id) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Lấy chi tiết Định mức thành công", bomService.getBomById(id))
        );
    }

    @PostMapping
    @PreAuthorize("hasRole('PRODUCTION_MANAGER') or hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<ResponseObject> createBom(@RequestBody com.pcwms.backend.dto.request.BomCreateRequest request) {
        BomResponse newBom = bomService.createBom(request);
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Tạo Định mức (BOM) thành công", newBom)
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PRODUCTION_MANAGER') or hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<ResponseObject> updateBom(
            @PathVariable Long id,
            @RequestBody BomUpdateRequest request) {

        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Cập nhật Định mức (BOM) thành công", bomService.updateBom(id, request))
        );
    }


}