package com.pcwms.backend.controller;

import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.entity.Customer;
import com.pcwms.backend.services.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/customer")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @GetMapping()
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('STAFF')")
    public ResponseEntity<ResponseObject> getCustomer(@PathVariable Long id) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Lấy danh sách thành công",
                        customerService.findAll())
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('STAFF')")
    public ResponseEntity<ResponseObject> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Lấy danh sách thành công",
                        customerService.findById(id))
        );
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('STAFF')")
    public ResponseEntity<ResponseObject> createCustomer(@RequestBody Customer customer) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Tạo thành công",
                        customerService.createCutomer(customer))
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('STAFF')")
    public ResponseEntity<ResponseObject> updateCustomer(@PathVariable Long id,
                                                          @RequestBody Customer customer) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Cập nhật thành công",
                        customerService.updateCutomer(id, customer))
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('STAFF')")
    public ResponseEntity<ResponseObject> deleteCustomer(@PathVariable Long id) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Xoá thành công",
                        null)
        );
    }
}
