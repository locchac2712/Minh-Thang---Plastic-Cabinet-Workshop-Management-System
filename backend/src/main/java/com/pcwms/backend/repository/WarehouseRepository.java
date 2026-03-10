package com.pcwms.backend.repository;

import com.pcwms.backend.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    List<Warehouse> findByNameContainingIgnoreCaseOrCodeContainingIgnoreCase(String name, String code);
}
