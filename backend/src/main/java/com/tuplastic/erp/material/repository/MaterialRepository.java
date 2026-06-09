package com.tuplastic.erp.material.repository;

import com.tuplastic.erp.material.entity.Material;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaterialRepository extends JpaRepository<Material, UUID> {

    boolean existsByCode(String code);

    @Query(value = """
            SELECT m.* FROM materials m
            WHERE (:search IS NULL OR
                   LOWER(unaccent(m.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%')))
                   OR LOWER(m.code) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:isActive IS NULL OR m.is_active = :isActive)
            """,
            countQuery = """
            SELECT COUNT(*) FROM materials m
            WHERE (:search IS NULL OR
                   LOWER(unaccent(m.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%')))
                   OR LOWER(m.code) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:isActive IS NULL OR m.is_active = :isActive)
            """,
            nativeQuery = true)
    Page<Material> findAllWithFilters(@Param("search") String search,
                                      @Param("isActive") Boolean isActive,
                                      Pageable pageable);

    @Query("SELECT m FROM Material m WHERE m.isActive = true AND m.stockQuantity <= m.minStockLevel ORDER BY m.stockQuantity ASC")
    List<Material> findLowStock();

    @Query("SELECT DISTINCT m FROM Material m LEFT JOIN FETCH m.suppliers WHERE m.isActive = true AND m.stockQuantity <= m.minStockLevel")
    List<Material> findLowStockWithSuppliers();

    @Query("SELECT COUNT(m) FROM Material m WHERE m.isActive = true AND m.stockQuantity <= m.minStockLevel")
    long countLowStockActive();

    @Query("SELECT m FROM Material m LEFT JOIN FETCH m.suppliers WHERE m.id = :id")
    Optional<Material> findByIdWithSuppliers(@Param("id") UUID id);

    @Query(value = """
            SELECT material_id, COUNT(supplier_id) AS cnt
            FROM material_supplier
            WHERE material_id IN :ids
            GROUP BY material_id
            """, nativeQuery = true)
    List<Object[]> countLinkedSuppliersByMaterialIds(@Param("ids") List<UUID> ids);

    @Query(value = """
            SELECT m.* FROM materials m
            INNER JOIN material_supplier ms ON ms.material_id = m.id
            WHERE ms.supplier_id = CAST(:supplierId AS uuid)
              AND (:search IS NULL OR
                   LOWER(unaccent(m.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%')))
                   OR LOWER(m.code) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:isActive IS NULL OR m.is_active = :isActive)
            ORDER BY m.name ASC
            """,
            countQuery = """
            SELECT COUNT(*) FROM materials m
            INNER JOIN material_supplier ms ON ms.material_id = m.id
            WHERE ms.supplier_id = CAST(:supplierId AS uuid)
              AND (:search IS NULL OR
                   LOWER(unaccent(m.name)) LIKE LOWER(unaccent(CONCAT('%', :search, '%')))
                   OR LOWER(m.code) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:isActive IS NULL OR m.is_active = :isActive)
            """,
            nativeQuery = true)
    Page<Material> findBySupplierIdWithFilters(
            @Param("supplierId") UUID supplierId,
            @Param("search") String search,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    @Query(value = """
            SELECT ms.material_id FROM material_supplier ms
            WHERE ms.supplier_id = :supplierId
            """, nativeQuery = true)
    List<UUID> findMaterialIdsBySupplierId(@Param("supplierId") UUID supplierId);

    @Query(value = """
            SELECT EXISTS (
                SELECT 1 FROM material_supplier ms
                WHERE ms.supplier_id = :supplierId AND ms.material_id = :materialId
            )
            """, nativeQuery = true)
    boolean existsSupplierMaterialLink(
            @Param("supplierId") UUID supplierId,
            @Param("materialId") UUID materialId);
}
