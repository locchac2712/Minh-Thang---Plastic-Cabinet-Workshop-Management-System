package com.pcwms.backend.repository;

import com.pcwms.backend.entity.SalesOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

    boolean existsByQuotationId(Long quotationId);

    @Query("SELECT s FROM SalesOrder s WHERE " +
            "(LOWER(s.orderNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(s.customer.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:status IS NULL OR s.status = :status) " +
            "AND (:paymentStatus IS NULL OR s.paymentStatus = :paymentStatus)")
    Page<SalesOrder> searchSalesOrders(
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("paymentStatus") String paymentStatus,
            Pageable pageable);
    @Query("SELECT s FROM SalesOrder s JOIN FETCH s.customer WHERE s.id = :id")
    Optional<SalesOrder> findByIdWithCustomer(@Param("id") Long id);
}