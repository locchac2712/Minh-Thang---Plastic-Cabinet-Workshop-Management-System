package com.pcwms.backend.repository;

import com.pcwms.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    // Tìm kiếm sản phẩm theo SKU
    boolean existsBySku(String sku);
    Optional<Product> findBySku(String sku);
    Product getProductById(Long id);
}