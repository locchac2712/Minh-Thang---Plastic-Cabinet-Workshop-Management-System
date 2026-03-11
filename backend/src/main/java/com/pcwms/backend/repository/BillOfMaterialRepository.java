package com.pcwms.backend.repository;

import com.pcwms.backend.entity.BillOfMaterial; // 👉 Đảm bảo đã import Entity này
import org.springframework.data.jpa.repository.JpaRepository; // 👉 Đảm bảo có thư viện JPA
import org.springframework.stereotype.Repository;

@Repository
// 👉 CHÚ Ý ĐOẠN NÀY BẮT BUỘC PHẢI CÓ: extends JpaRepository<Tên_Entity, Kiểu_dữ_liệu_của_ID>
public interface BillOfMaterialRepository extends JpaRepository<BillOfMaterial, Long> {

}