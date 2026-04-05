package com.pcwms.backend.repository;

import com.pcwms.backend.entity.SalesOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

    boolean existsByQuotationId(Long quotationId);

    // 1. Cập nhật searchSalesOrders để tránh lỗi bytea khi keyword null/rỗng
    @Query("SELECT s FROM SalesOrder s " +
            "JOIN FETCH s.customer c " +
            "WHERE (LOWER(CAST(s.orderNumber AS text)) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%')) " +
            "   OR LOWER(CAST(c.name AS text)) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%')) " +
            ") " +
            "AND (COALESCE(:statuses, NULL) IS NULL OR s.status IN :statuses) " +
            "AND (:paymentStatus IS NULL OR s.paymentStatus = :paymentStatus) " +
            "AND (:customerId IS NULL OR c.id = :customerId) " +
            "AND (:startDate IS NULL OR s.dueDate >= :startDate) " +
            "AND (:endDate IS NULL OR s.dueDate <= :endDate)")
    Page<SalesOrder> searchSalesOrders(
            @Param("keyword") String keyword,
            @Param("statuses") List<String> statuses,
            @Param("paymentStatus") String paymentStatus,
            @Param("customerId") Long customerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable);

    @Query("SELECT s FROM SalesOrder s JOIN FETCH s.customer WHERE s.id = :id")
    Optional<SalesOrder> findByIdWithCustomer(@Param("id") Long id);

    @Query("SELECT s FROM SalesOrder s JOIN FETCH s.customer c WHERE " +
            "s.status = 'CONFIRMED' " +
            "AND (" +
            "   :keyword IS NULL OR :keyword = '' " +
            "   OR LOWER(CAST(s.orderNumber AS text)) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%')) " +
            "   OR LOWER(CAST(c.name AS text)) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%')) " +
            ")")
    Page<SalesOrder> findOrdersForProduction(
            @Param("keyword") String keyword,
            Pageable pageable
    );

    // Cho Dashboard CRM
    List<SalesOrder> findByCreatedDateBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
}