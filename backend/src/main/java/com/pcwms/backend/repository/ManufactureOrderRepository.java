package com.pcwms.backend.repository;

import com.pcwms.backend.entity.ManufactureOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ManufactureOrderRepository extends JpaRepository<ManufactureOrder, Long> {
    List<ManufactureOrder> findByProductionPlanId(Long planId);
    List<ManufactureOrder> findBySalesOrderId(Long salesOrderId);
}
