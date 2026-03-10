package com.pcwms.backend.repository;

import com.pcwms.backend.entity.StockCount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockCountRepository extends JpaRepository<StockCount, Long> {
}
