package com.pcwms.backend.controller;

import com.pcwms.backend.dto.request.WarehouseTransactionRequest;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.security.services.UserDetailsImpl;
import com.pcwms.backend.services.WarehouseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/warehouse")
public class WarehouseController {

    @Autowired
    private WarehouseService warehouseService;

    @PostMapping("/import")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER')")
    public ResponseEntity<ResponseObject> importMaterials(@RequestBody WarehouseTransactionRequest request) {

        // Bóc ID của User từ Token đã xác thực
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long currentUserId = userDetails.getId();
        if (currentUserId == null) {
            throw new RuntimeException("BẮT ĐƯỢC LỖI: Lấy Token thành công nhưng currentUserId bị null!");
        }

        return ResponseEntity.ok(
                new ResponseObject(
                        "SUCCESS",
                        "Tạo phiếu nhập kho thành công!",
                        warehouseService.importMaterials(request, currentUserId)
                )
        );
    }

    @PostMapping("/export")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER') or hasRole('PRODUCTION_MANAGER')")
    public ResponseEntity <ResponseObject> exportMaterials(@RequestBody WarehouseTransactionRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long currentUserId = userDetails.getId();

        return ResponseEntity.ok(
                new ResponseObject(
                        "SUCCESS",
                        "Tạo phiếu xuất kho thành công!",
                        warehouseService.exportMaterials(request, currentUserId)
                )
        );
    }
}