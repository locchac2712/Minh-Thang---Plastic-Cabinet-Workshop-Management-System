package com.pcwms.backend.repository;

import com.pcwms.backend.entity.Quotation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    @Query("SELECT q FROM Quotation q JOIN q.customer c WHERE " +
            "(:keyword IS NULL OR LOWER(CAST(q.quotationNumber AS text)) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%')) " +
            "OR LOWER(CAST(c.name AS text)) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%'))) " +
            "AND (CAST(:status AS String) IS NULL OR q.status = :status) " +
            "AND (CAST(:customerId AS Long) IS NULL OR c.id = :customerId) " +
            "AND (CAST(:startDate AS timestamp) IS NULL OR q.createdDate >= :startDate) " +
            "AND (CAST(:endDate AS timestamp) IS NULL OR q.createdDate <= :endDate)")
    Page<Quotation> searchQuotations(
            @Param("keyword") String keyword,
            @Param("status")  String status,
            @Param("customerId") Long customerId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Modifying
    @Transactional
    @Query("DELETE FROM Quotation q WHERE q.status IN ('ACCEPTED', 'CANCELLED', 'SENT') OR q.status IS NULL")
    void cleanupOldStatuses();
}