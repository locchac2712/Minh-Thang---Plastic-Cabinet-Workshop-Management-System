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
        if (customerRepository.existsByName(customer.getName())) {
            throw new RuntimeException("Tên khách hàng đã tồn tại trong hệ thống!");
        }

        // Tự động tạo mã khách hàng nếu để trống (KH + STT)
        if (customer.getTaxCode() == null || customer.getTaxCode().trim().isEmpty()) {
            long count = customerRepository.count() + 1;
            String autoCode = "KH - " + String.format("%04d", count);
            
            // Đảm bảo không trùng (vòng lặp fallback đơn giản)
            while (customerRepository.existsByTaxCode(autoCode)) {
                count++;
                autoCode = "KH - " + String.format("%04d", count);
            }
            customer.setTaxCode(autoCode);
        }
        
        if (customer.getCurrentDebt() == null) customer.setCurrentDebt(java.math.BigDecimal.ZERO);
        if (customer.getCreditLimit() == null) customer.setCreditLimit(java.math.BigDecimal.ZERO);

        return customerRepository.save(customer);
    }

    public Customer updateCustomer(Long id, Customer customer) {
        Customer existing = getCustomerById(id);
        existing.setName(customer.getName());
        existing.setAddress(customer.getAddress());
        existing.setTaxCode(customer.getTaxCode());
        existing.setCreditLimit(customer.getCreditLimit());
        existing.setEmail(customer.getEmail());
        existing.setPhoneNumber(customer.getPhoneNumber());
        
        // --- CRM FIELDS ---
        existing.setCustomerType(customer.getCustomerType());
        existing.setSource(customer.getSource());
        existing.setBirthday(customer.getBirthday());
        existing.setAssignedTo(customer.getAssignedTo());
        
        return customerRepository.save(existing);
    }

    public Customer updateStatus(Long id, boolean active) {
        Customer customer = getCustomerById(id);
        customer.setActive(active);
        return customerRepository.save(customer);
    }

    public void deleteCustomer(Long id) {
        updateStatus(id, false);
    }

    public List<Customer> getAllActiveCustomers() {
        return customerRepository.findByActiveTrue();
    }

    public List<Customer> getAllInactiveCustomers() {
        return customerRepository.findByActiveFalse();
    }
}
