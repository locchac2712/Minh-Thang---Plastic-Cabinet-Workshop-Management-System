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
        if (customer.getPhoneNumber() != null && customerRepository.existsByPhoneNumber(customer.getPhoneNumber())) {
            throw new RuntimeException("Số điện thoại này đã được sử dụng bởi một khách hàng khác!");
        }
        if (customer.getEmail() != null && !customer.getEmail().isEmpty() && customerRepository.existsByEmail(customer.getEmail())) {
            throw new RuntimeException("Email này đã được sử dụng bởi một khách hàng khác!");
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
        existing.setCurrentDebt(existing.getCurrentDebt());
        return customerRepository.save(existing);
    }

    public void deleteCustomer(Long id) {
        Customer customer = getCustomerById(id);

        customerRepository.delete(customer);
    }

}
