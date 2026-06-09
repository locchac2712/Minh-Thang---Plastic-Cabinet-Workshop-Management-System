package com.tuplastic.erp.bom.repository;

import com.tuplastic.erp.bom.entity.BomItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BomItemRepository extends JpaRepository<BomItem, UUID> {

    List<BomItem> findByProductIdOrderByCreatedAtAsc(UUID productId);

    @Query("SELECT b FROM BomItem b JOIN FETCH b.material WHERE b.product.id = :productId ORDER BY b.createdAt ASC")
    List<BomItem> findByProductIdWithMaterialOrderByCreatedAtAsc(@Param("productId") UUID productId);

    boolean existsByProductIdAndMaterialId(UUID productId, UUID materialId);

    void deleteByProduct_Id(UUID productId);
}
