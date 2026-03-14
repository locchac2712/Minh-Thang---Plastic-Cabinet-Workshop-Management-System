package com.pcwms.backend.services;

import com.pcwms.backend.entity.Customer;
import com.pcwms.backend.entity.Supplier;
import com.pcwms.backend.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerService {
    @Autowired
    private CustomerRepository customerRepository;

    public List<Customer> getAllCustomer() {
        return customerRepository.findAll();
    }

    public Customer getCustomerById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng với ID: " + id));
    }

    public Customer createCustomer(Customer customer) {
        // Tên khách hàng logic check if name exists
        if (customerRepository.existsByName(customer.getName())) {
            throw new RuntimeException("Tên khách hàng đã tồn tại trong hệ thống!");
        }
        return customerRepository.save(customer);
    }

    public Customer updateCustomer(Long id, Customer customer) {
        Customer existing = getCustomerById(id);
        existing.setName(customer.getName());
        existing.setAddress(customer.getAddress());
        existing.setTaxCode(customer.getTaxCode());
        existing.setCreditLimit(customer.getCreditLimit());
        existing.setEmail(customer.getEmail());
        existing.setCurrentDebt(customer.getCurrentDebt());
        return customerRepository.save(existing);
    }

    public void deleteCustomer(Long id) {
        Customer customer = getCustomerById(id);
        customerRepository.delete(customer);
    }

}
