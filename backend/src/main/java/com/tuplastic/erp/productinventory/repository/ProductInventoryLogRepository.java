package com.tuplastic.erp.productinventory.repository;

import com.tuplastic.erp.productinventory.entity.ProductInventoryLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProductInventoryLogRepository extends JpaRepository<ProductInventoryLog, UUID> {

    @Query("""
            SELECT l FROM ProductInventoryLog l
            WHERE (:productId IS NULL OR l.product.id = :productId)
              AND (:transactionType IS NULL OR l.transactionType = :transactionType)
            """)
    Page<ProductInventoryLog> findWithFilters(@Param("productId") UUID productId,
                                              @Param("transactionType") String transactionType,
                                              Pageable pageable);
}
