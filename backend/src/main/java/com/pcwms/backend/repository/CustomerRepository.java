package com.pcwms.backend.repository;

import com.pcwms.backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    boolean existsByName(String name);
    boolean existsByPhoneNumber(String phoneNumber);
    boolean existsByEmail(String email);
}