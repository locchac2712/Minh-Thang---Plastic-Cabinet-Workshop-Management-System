package com.pcwms.backend.repository;

import com.pcwms.backend.entity.CustomerType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerTypeRepository extends JpaRepository<CustomerType, Long> {
    CustomerType findByCode(String code);
}
