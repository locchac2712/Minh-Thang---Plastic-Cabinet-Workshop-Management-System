package com.pcwms.backend.repository;

import com.pcwms.backend.entity.ProductionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductionPlanRepository extends JpaRepository<ProductionPlan, Long> {
    Optional<ProductionPlan> findBySalesOrderId(Long salesOrderId);
    List<ProductionPlan> findAllByStatus(String status);
}
