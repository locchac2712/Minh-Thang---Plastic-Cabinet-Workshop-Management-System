package com.pcwms.backend.repository;

import com.pcwms.backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    boolean existsByName(String name);
    boolean existsByPhoneNumber(String phoneNumber);
    boolean existsByEmail(String email);
    boolean existsByTaxCode(String taxCode);

    List<Customer> findByActiveTrue();
    List<Customer> findByActiveFalse();

    @Query("SELECT c FROM Customer c LEFT JOIN FETCH c.assignedTo")
    List<Customer> findAllWithAssignedTo();

    @Query("SELECT c FROM Customer c LEFT JOIN FETCH c.assignedTo WHERE c.active = true")
    List<Customer> findByActiveTrueWithAssignedTo();

    @Query("SELECT c FROM Customer c LEFT JOIN FETCH c.assignedTo WHERE c.active = false")
    List<Customer> findByActiveFalseWithAssignedTo();

    @Query("SELECT c FROM Customer c LEFT JOIN FETCH c.assignedTo WHERE c.id = :id")
    Optional<Customer> findByIdWithAssignedTo(Long id);
}