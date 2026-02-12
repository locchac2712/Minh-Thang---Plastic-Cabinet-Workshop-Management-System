package com.pcwms.backend.repository;

import com.pcwms.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    // Tìm kiếm sản phẩm theo SKU
    boolean existsBySku(String sku);
}