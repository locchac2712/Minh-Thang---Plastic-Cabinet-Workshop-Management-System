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
@RequestMapping("/api/v1/supplier")
public class SuppilerController {

    @Autowired
    private SupplierService  supplierService;

    @GetMapping()
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('STAFF')")
    public ResponseEntity<ResponseObject> getSupplier(@PathVariable  Long id) {
        return ResponseEntity.ok(
                new ResponseObject("SUCESS","Lấy thành công.",supplierService.getAllSuppiler())
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('STAFF')")
    public ResponseEntity<ResponseObject> getSupplierById(@PathVariable  Long id) {
        return ResponseEntity.ok(
                new ResponseObject("SUCESS","Lấy thành công.",supplierService.findById(id))
        );
    }

    // có admin , director tạo đuọc
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('STAFF')")
    public ResponseEntity<ResponseObject> createSupplier(@RequestBody Supplier supplier) {
        return ResponseEntity.ok(
                new ResponseObject("SUCESS","Tạo thành công.",supplierService.createSupplier(supplier))
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('STAFF')")
    public ResponseEntity<ResponseObject> updateSupplier(@PathVariable  Long id,
                                                         @RequestBody Supplier supplier) {
        return ResponseEntity.ok(
                new ResponseObject("SUCESS","Cập nhật thành công",supplierService.updateSupplier(id,supplier))
        );
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('STAFF')")
    public ResponseEntity<ResponseObject> deleteSupplier(@PathVariable  Long id) {
        return ResponseEntity.ok(
                new ResponseObject("SUCESS","Xoá thành công",null)
        );
    }





}
