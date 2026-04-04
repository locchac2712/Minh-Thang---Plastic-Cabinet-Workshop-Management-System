package com.pcwms.backend.controller;

import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.entity.Customer;
import com.pcwms.backend.services.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseObject> getAllCustomer(@RequestParam(required = false) Boolean active) {
        Object data;
        if (active == null) {
            data = customerService.getAllCustomer();
        } else if (active) {
            data = customerService.getAllActiveCustomers();
        } else {
            data = customerService.getAllInactiveCustomers();
        }
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Lấy danh sách khách hàng thành công", data)
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseObject> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Lấy thông tin khách hàng thành công",
                        customerService.getCustomerById(id))
        );
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('SALES_MANAGER') or hasRole('SALES_STAFF')")
    public ResponseEntity<ResponseObject> createCustomer(@RequestBody Customer customer) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Thêm khách hàng thành công",
                        customerService.createCustomer(customer))
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('SALES_MANAGER') or hasRole('SALES_STAFF')")
    public ResponseEntity<ResponseObject> updateCustomer(@PathVariable Long id, @RequestBody Customer customer) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Cập nhật khách hàng thành công",
                        customerService.updateCustomer(id, customer))
        );
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('SALES_MANAGER') or hasRole('SALES_STAFF')")
    public ResponseEntity<ResponseObject> toggleStatus(@PathVariable Long id, @RequestParam boolean status) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Cập nhật trạng thái thành công",
                        customerService.updateStatus(id, status))
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') ")
    public ResponseEntity<ResponseObject> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Ngừng hoạt động khách hàng thành công", null)
        );
    }
}
