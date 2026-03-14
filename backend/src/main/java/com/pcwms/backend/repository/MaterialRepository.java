package com.pcwms.backend.repository;

import com.pcwms.backend.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MaterialRepository extends JpaRepository<Material,Long> {
    //kiểm tra tên nguyên liệu đã tồn tại chưa
    boolean existsByName(String name);

    boolean existsBySku(String sku);
}
