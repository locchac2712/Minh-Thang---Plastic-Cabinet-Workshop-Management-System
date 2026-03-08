package com.pcwms.backend.repository;

import com.pcwms.backend.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    // Check trùng tên nhà cung cấp
    boolean existsByName(String name);
}