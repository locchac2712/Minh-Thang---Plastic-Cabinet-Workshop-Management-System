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
    @Query("SELECT q FROM Quotation q JOIN q.customer c WHERE " +
            "(:keyword IS NULL OR LOWER(CAST(q.quotationNumber AS string)) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) " +
            "OR LOWER(CAST(c.name AS string)) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))) " +
            "AND (:status IS NULL OR q.status = CAST(:status AS string)) " +
            "AND (:customerId IS NULL OR c.id = :customerId)")
    Page<Quotation> searchQuotations(
            @Param("keyword") String keyword,
            @Param("status")  String status,
            @Param("customerId") Long customerId,
            Pageable pageable
    );
}