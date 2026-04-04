package com.pcwms.backend.repository;

import com.pcwms.backend.entity.SalesOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

    boolean existsByQuotationId(Long quotationId);

    // 1. Cập nhật searchSalesOrders để tránh lỗi bytea khi keyword null/rỗng
    @Query("SELECT s FROM SalesOrder s JOIN s.customer c WHERE " +
            "(" +
            "   :keyword IS NULL OR :keyword = '' " +
            "   OR LOWER(s.orderNumber) LIKE LOWER(CAST(CONCAT('%', :keyword, '%') AS String)) " +
            "   OR LOWER(c.name) LIKE LOWER(CAST(CONCAT('%', :keyword, '%') AS String)) " +
            ") " +
            "AND (:status IS NULL OR s.status = :status) " +
            "AND (:paymentStatus IS NULL OR s.paymentStatus = :paymentStatus) " +
            "AND (:customerId IS NULL OR c.id = :customerId)")
    Page<SalesOrder> searchSalesOrders(
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("paymentStatus") String paymentStatus,
            @Param("customerId") Long customerId,
            Pageable pageable);

    @Query("SELECT s FROM SalesOrder s JOIN FETCH s.customer WHERE s.id = :id")
    Optional<SalesOrder> findByIdWithCustomer(@Param("id") Long id);

    @Query("SELECT s FROM SalesOrder s JOIN s.customer c WHERE " +
            "s.status = 'CONFIRMED' " +
            "AND s.paymentStatus IN ('PARTIAL', 'PAID') " +
            "AND (" +
            "   :keyword IS NULL OR :keyword = '' " +
            "   OR LOWER(s.orderNumber) LIKE LOWER(CAST(CONCAT('%', :keyword, '%') AS String)) " +
            "   OR LOWER(c.name) LIKE LOWER(CAST(CONCAT('%', :keyword, '%') AS String)) " +
            ")")
    Page<SalesOrder> findOrdersForProduction(
            @Param("keyword") String keyword,
            Pageable pageable
    );

    // Cho Dashboard CRM
    List<SalesOrder> findByCreatedDateBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
}