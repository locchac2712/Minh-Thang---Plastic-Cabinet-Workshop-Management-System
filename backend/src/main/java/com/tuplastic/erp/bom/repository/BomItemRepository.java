package com.tuplastic.erp.bom.repository;

import com.tuplastic.erp.bom.entity.BomItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BomItemRepository extends JpaRepository<BomItem, UUID> {

    List<BomItem> findByProductIdOrderByCreatedAtAsc(UUID productId);

    boolean existsByProductIdAndMaterialId(UUID productId, UUID materialId);

    void deleteByProduct_Id(UUID productId);
}
