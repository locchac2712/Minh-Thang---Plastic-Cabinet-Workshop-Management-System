package com.pcwms.backend.services;

import com.pcwms.backend.entity.Customer;
import com.pcwms.backend.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerService {
    @Autowired
    private CustomerRepository customerRepository;

    // read all khach hang
    public List<Customer> findAll() {
        return customerRepository.findAll();
    }

    // lay chi tiet 1 khach hang
    public Customer findById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng với ID: " + id ));
    }

    //tao moi khach hang
    public Customer createCutomer(Customer customer) {
        if (customerRepository.findById(customer.getId()).isPresent()) {
            throw new RuntimeException("Khách hàng đã tồn tại.");
        }
        return customerRepository.save(customer);
    }

    // update thong tin khach hang
    public Customer updateCutomer(Long id,Customer newCustomer) {
        Customer customer = findById(id);

        customer.setAddress(newCustomer.getAddress());
        customer.setCompanyName(newCustomer.getCompanyName());
        customer.setCreditLimit(newCustomer.getCreditLimit());
        customer.setCurrentDebt(newCustomer.getCurrentDebt());
        return customerRepository.save(customer);

    }

    // delete khach hang
    public void deleteCutomer(Long id) {
        Customer customer = findById(id);
        customerRepository.delete(customer);
    }

}
