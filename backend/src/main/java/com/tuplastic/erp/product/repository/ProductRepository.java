package com.tuplastic.erp.product.repository;

import com.tuplastic.erp.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    boolean existsBySku(String sku);

    long countByIsActiveTrue();

    @Query(value = """
            SELECT p.* FROM products p
            WHERE (:categoryId IS NULL OR p.category_id = CAST(:categoryId AS UUID))
              AND (:search IS NULL OR
                   LOWER(unaccent(p.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%')))
                   OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:isActive IS NULL OR p.is_active = :isActive)
              AND (:inStock IS NULL OR (:inStock = true AND p.stock_quantity > 0))
            ORDER BY p.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM products p
            WHERE (:categoryId IS NULL OR p.category_id = CAST(:categoryId AS UUID))
              AND (:search IS NULL OR
                   LOWER(unaccent(p.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%')))
                   OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:isActive IS NULL OR p.is_active = :isActive)
              AND (:inStock IS NULL OR (:inStock = true AND p.stock_quantity > 0))
            """,
            nativeQuery = true)
    Page<Product> findAllWithFilters(@Param("categoryId") UUID categoryId,
                                     @Param("search") String search,
                                     @Param("isActive") Boolean isActive,
                                     @Param("inStock") Boolean inStock,
                                     Pageable pageable);

    /**
     * Catalog cho seller: thêm lọc {@code agency_id}, {@code is_custom}.
     * Khi {@code isCustom = true} và không truyền {@code agencyId}, chỉ trả SP custom thuộc đại lý do seller phụ trách.
     */
    @Query(value = """
            SELECT p.* FROM products p
            WHERE (:categoryId IS NULL OR p.category_id = CAST(:categoryId AS UUID))
              AND (:search IS NULL OR
                   LOWER(unaccent(p.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%')))
                   OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:isActive IS NULL OR p.is_active = :isActive)
              AND (:inStock IS NULL OR (:inStock = true AND p.stock_quantity > 0))
              AND (:agencyId IS NULL OR p.agency_id = CAST(:agencyId AS UUID))
              AND (:isCustom IS NULL OR p.is_custom = :isCustom)
              AND (
                :agencyId IS NOT NULL
                OR :isCustom IS DISTINCT FROM TRUE
                OR EXISTS (
                  SELECT 1 FROM agencies a
                  WHERE a.id = p.agency_id AND a.assigned_seller_id = CAST(:sellerId AS UUID)
                )
              )
            ORDER BY p.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM products p
            WHERE (:categoryId IS NULL OR p.category_id = CAST(:categoryId AS UUID))
              AND (:search IS NULL OR
                   LOWER(unaccent(p.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%')))
                   OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:isActive IS NULL OR p.is_active = :isActive)
              AND (:inStock IS NULL OR (:inStock = true AND p.stock_quantity > 0))
              AND (:agencyId IS NULL OR p.agency_id = CAST(:agencyId AS UUID))
              AND (:isCustom IS NULL OR p.is_custom = :isCustom)
              AND (
                :agencyId IS NOT NULL
                OR :isCustom IS DISTINCT FROM TRUE
                OR EXISTS (
                  SELECT 1 FROM agencies a
                  WHERE a.id = p.agency_id AND a.assigned_seller_id = CAST(:sellerId AS UUID)
                )
              )
            """,
            nativeQuery = true)
    Page<Product> findSellerCatalogWithFilters(@Param("sellerId") UUID sellerId,
                                               @Param("categoryId") UUID categoryId,
                                               @Param("search") String search,
                                               @Param("isActive") Boolean isActive,
                                               @Param("inStock") Boolean inStock,
                                               @Param("agencyId") UUID agencyId,
                                               @Param("isCustom") Boolean isCustom,
                                               Pageable pageable);

    @Query(value = """
            SELECT p.* FROM products p
            WHERE p.is_custom = TRUE
              AND (:agencyId IS NULL OR p.agency_id = CAST(:agencyId AS UUID))
              AND (:search IS NULL OR
                   LOWER(unaccent(p.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%')))
                   OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY p.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM products p
            WHERE p.is_custom = TRUE
              AND (:agencyId IS NULL OR p.agency_id = CAST(:agencyId AS UUID))
              AND (:search IS NULL OR
                   LOWER(unaccent(p.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%')))
                   OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))
            """,
            nativeQuery = true)
    Page<Product> findCustomProducts(@Param("agencyId") UUID agencyId,
                                     @Param("search") String search,
                                     Pageable pageable);
}
