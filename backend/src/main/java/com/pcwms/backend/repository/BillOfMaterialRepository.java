package com.pcwms.backend.repository;

import com.pcwms.backend.entity.BillOfMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
// 👉 CHÚ Ý ĐOẠN NÀY BẮT BUỘC PHẢI CÓ: extends JpaRepository<Tên_Entity, Kiểu_dữ_liệu_của_ID>
public interface BillOfMaterialRepository extends JpaRepository<BillOfMaterial, Long> {

    Optional<BillOfMaterial> findByProductIdAndIsActiveTrue(Long productId);
}