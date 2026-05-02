package com.tuplastic.erp.supplier.repository;

import com.tuplastic.erp.supplier.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.UUID;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, UUID> {

    @Query(value = """
            SELECT s.* FROM suppliers s
            WHERE (:search IS NULL OR
                   LOWER(unaccent(s.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%'))))
              AND (:hasDebt IS NULL
                   OR (:hasDebt = true AND COALESCE(s.total_debt, 0) > 0)
                   OR (:hasDebt = false AND COALESCE(s.total_debt, 0) = 0))
            ORDER BY s.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM suppliers s
            WHERE (:search IS NULL OR
                   LOWER(unaccent(s.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%'))))
              AND (:hasDebt IS NULL
                   OR (:hasDebt = true AND COALESCE(s.total_debt, 0) > 0)
                   OR (:hasDebt = false AND COALESCE(s.total_debt, 0) = 0))
            """,
            nativeQuery = true)
    Page<Supplier> findAllWithFilters(@Param("search") String search,
                                      @Param("hasDebt") Boolean hasDebt,
                                      Pageable pageable);

    @Query("SELECT COUNT(s) FROM Supplier s WHERE s.totalDebt > :minDebt")
    long countByTotalDebtGreaterThan(@Param("minDebt") BigDecimal minDebt);
}
