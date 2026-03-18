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

    // Dùng :keyword = '' thay vì IS NULL hoặc COALESCE để tránh lỗi PostgreSQL explicit type cast.
    // Service sẽ luôn truyền "" (empty string) khi không có filter, không bao giờ truyền null.
    @Query("SELECT q FROM Quotation q LEFT JOIN q.customer c WHERE " +
            "(:keyword = '' OR LOWER(q.quotationNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:status = '' OR q.status = :status) " +
            "AND (:minPrice IS NULL OR q.totalAmount >= :minPrice) " +
            "AND (:maxPrice IS NULL OR q.totalAmount <= :maxPrice) " +
            "AND (cast(:startDate as timestamp) IS NULL OR q.createdDate >= :startDate) " +
            "AND (cast(:endDate as timestamp) IS NULL OR q.createdDate <= :endDate)")
    Page<Quotation> searchQuotations(
            @Param("keyword") String keyword,
            @Param("status")  String status,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate,
            Pageable pageable
    );
}