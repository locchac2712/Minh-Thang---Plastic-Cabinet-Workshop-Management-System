package com.tuplastic.erp.inventory.repository;

import com.tuplastic.erp.inventory.entity.InventoryLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryLogRepository extends JpaRepository<InventoryLog, UUID> {

    @Query("""
            SELECT l FROM InventoryLog l
            WHERE (:materialId IS NULL OR l.material.id = :materialId)
              AND (:taskId IS NULL OR l.task.id = :taskId)
              AND (:transactionType IS NULL OR l.transactionType = :transactionType)
            ORDER BY l.createdAt DESC
            """)
    Page<InventoryLog> findWithFilters(@Param("materialId") UUID materialId,
                                       @Param("taskId") UUID taskId,
                                       @Param("transactionType") String transactionType,
                                       Pageable pageable);

    boolean existsByTaskIdAndCreatedAtBetween(UUID taskId, LocalDateTime from, LocalDateTime to);

    @Query("""
            SELECT il FROM InventoryLog il
            JOIN FETCH il.material m
            JOIN FETCH il.task pt
            LEFT JOIN FETCH pt.assignedTo
            LEFT JOIN FETCH pt.product
            WHERE il.transactionType = 'WASTE'
              AND pt.order.id = :orderId
            ORDER BY il.createdAt DESC
            """)
    List<InventoryLog> findWasteLogsByOrderId(@Param("orderId") UUID orderId);
}
