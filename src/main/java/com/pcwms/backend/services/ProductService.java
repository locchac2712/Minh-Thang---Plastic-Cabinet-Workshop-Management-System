package com.pcwms.backend.services;

import com.pcwms.backend.entity.Product;
import com.pcwms.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product createProduct(Product product) {
        if (productRepository.existsBySku(product.getSku())) {
            throw new RuntimeException("Lỗi: SKU sản phẩm đã tồn tại!");
        }
        return productRepository.save(product);
    }
}