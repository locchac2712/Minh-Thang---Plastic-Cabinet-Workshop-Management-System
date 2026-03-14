package com.pcwms.backend.repository;

import com.pcwms.backend.entity.Quotation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    @Query("SELECT q FROM Quotation q WHERE " +
            "(:keyword IS NULL OR LOWER(q.quotationNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(q.customer.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:status IS NULL OR q.status = :status)")
    Page<Quotation> searchQuotations(@Param("keyword") String keyword, @Param("status") String status, Pageable pageable);
}