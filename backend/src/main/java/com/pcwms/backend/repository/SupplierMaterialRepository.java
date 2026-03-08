package com.pcwms.backend.repository;

import com.pcwms.backend.entity.SupplierMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupplierMaterialRepository extends JpaRepository<SupplierMaterial, Long> {
    // Tùy chọn: Sau này dùng để check xem vật tư này đã gán cho NCC này chưa
    boolean existsBySupplierIdAndMaterialId(Long supplierId, Long materialId);
}