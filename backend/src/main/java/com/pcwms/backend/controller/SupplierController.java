package com.pcwms.backend.controller;

import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.entity.Supplier;
import com.pcwms.backend.services.SupplierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/suppliers")
public class SupplierController {

    @Autowired
    private SupplierService supplierService;

    // Ai đăng nhập cũng xem được danh sách NCC (Để đổ vào Dropdown)
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseObject> getAllSuppliers() {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Lấy danh sách nhà cung cấp thành công", supplierService.getAllSuppliers())
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseObject> getSupplierById(@PathVariable Long id) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Lấy thông tin nhà cung cấp thành công", supplierService.getSupplierById(id))
        );
    }

    // Các thao tác Thêm/Sửa chỉ dành cho Quản lý trở lên
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('WAREHOUSE_MANAGER')")
    public ResponseEntity<ResponseObject> createSupplier(@RequestBody Supplier supplier) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Thêm nhà cung cấp thành công", supplierService.createSupplier(supplier))
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('WAREHOUSE_MANAGER')")
    public ResponseEntity<ResponseObject> updateSupplier(@PathVariable Long id, @RequestBody Supplier supplier) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Cập nhật nhà cung cấp thành công", supplierService.updateSupplier(id, supplier))
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<ResponseObject> deleteSupplier(@PathVariable Long id) {
        supplierService.deleteSupplier(id);
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Xóa nhà cung cấp thành công", null)
        );
    }
}