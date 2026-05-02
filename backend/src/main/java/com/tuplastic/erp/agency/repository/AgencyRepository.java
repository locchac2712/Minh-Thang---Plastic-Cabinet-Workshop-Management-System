package com.tuplastic.erp.agency.repository;

import com.tuplastic.erp.agency.entity.Agency;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgencyRepository extends JpaRepository<Agency, UUID> {

    @Query(value = """
            SELECT a.* FROM agencies a
            WHERE (:level IS NULL OR a.level = :level)
              AND (:isActive IS NULL OR a.is_active = :isActive)
              AND (:search IS NULL OR
                   LOWER(unaccent(a.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%')))
                   OR LOWER(a.tax_code) LIKE LOWER(CONCAT('%', :search, '%')))
            """,
            countQuery = """
            SELECT COUNT(*) FROM agencies a
            WHERE (:level IS NULL OR a.level = :level)
              AND (:isActive IS NULL OR a.is_active = :isActive)
              AND (:search IS NULL OR
                   LOWER(unaccent(a.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%')))
                   OR LOWER(a.tax_code) LIKE LOWER(CONCAT('%', :search, '%')))
            """,
            nativeQuery = true)
    Page<Agency> findAllWithFilters(@Param("level") String level,
                                    @Param("isActive") Boolean isActive,
                                    @Param("search") String search,
                                    Pageable pageable);

    @Query(value = """
            SELECT a.* FROM agencies a
            WHERE a.assigned_seller_id = :sellerId
              AND (:search IS NULL OR
                   LOWER(unaccent(a.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%')))
                   OR LOWER(a.tax_code) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:totalDebtGt IS NULL OR a.total_debt > :totalDebtGt)
            """,
            countQuery = """
            SELECT COUNT(*) FROM agencies a
            WHERE a.assigned_seller_id = :sellerId
              AND (:search IS NULL OR
                   LOWER(unaccent(a.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%')))
                   OR LOWER(a.tax_code) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:totalDebtGt IS NULL OR a.total_debt > :totalDebtGt)
            """,
            nativeQuery = true)
    Page<Agency> findBySellerWithFilters(@Param("sellerId") UUID sellerId,
                                         @Param("search") String search,
                                         @Param("totalDebtGt") BigDecimal totalDebtGt,
                                         Pageable pageable);

    Optional<Agency> findByIdAndAssignedSellerId(UUID id, UUID sellerId);

    boolean existsByNameAndAssignedSellerId(String name, UUID sellerId);

    long countByIsActiveTrue();

    @Query("SELECT a FROM Agency a ORDER BY a.createdAt DESC")
    Page<Agency> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query(value = """
            SELECT a.* FROM agencies a
            WHERE a.assigned_seller_id = CAST(:sellerId AS uuid)
              AND a.max_debt_limit > 0
              AND a.total_debt >= a.max_debt_limit * 0.8
            ORDER BY a.total_debt DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM agencies a
            WHERE a.assigned_seller_id = CAST(:sellerId AS uuid)
              AND a.max_debt_limit > 0
              AND a.total_debt >= a.max_debt_limit * 0.8
            """,
            nativeQuery = true)
    Page<Agency> findDebtRiskBySeller(@Param("sellerId") UUID sellerId, Pageable pageable);
}
