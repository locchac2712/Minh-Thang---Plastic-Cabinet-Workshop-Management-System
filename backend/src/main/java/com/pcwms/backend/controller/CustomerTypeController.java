package com.pcwms.backend.controller;

import com.pcwms.backend.entity.CustomerType;
import com.pcwms.backend.repository.CustomerTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer-types")
@CrossOrigin(origins = "*")
public class CustomerTypeController {

    @Autowired
    private CustomerTypeRepository customerTypeRepository;

    @GetMapping
    public List<CustomerType> getAll() {
        return customerTypeRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public CustomerType create(@RequestBody CustomerType customerType) {
        return customerTypeRepository.save(customerType);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CustomerType update(@PathVariable Long id, @RequestBody CustomerType details) {
        CustomerType ct = customerTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CustomerType not found"));
        ct.setName(details.getName());
        ct.setCode(details.getCode());
        ct.setDescription(details.getDescription());
        return customerTypeRepository.save(ct);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        customerTypeRepository.deleteById(id);
    }
}
