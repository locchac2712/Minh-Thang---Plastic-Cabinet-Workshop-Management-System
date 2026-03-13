package com.pcwms.backend.services;

import com.pcwms.backend.dto.response.ProductResponse; // 👉 Import DTO
import com.pcwms.backend.entity.Product;
import com.pcwms.backend.entity.ProductStatus; // 👉 Import Enum
import com.pcwms.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepository;

    // 1. 👉 TRẢ VỀ DTO ĐỂ CHỐNG LỖI JSON LẶP VÀ GIẤU DATA THỪA
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(ProductResponse::new)
                .collect(Collectors.toList());
    }

    // 2. 👉 HÀM LẤY CHI TIẾT TRẢ VỀ DTO CHO FRONTEND
    public ProductResponse getProductDetail(Long id) {
        Product product = getProductEntityById(id);
        return new ProductResponse(product);
    }

    // 👉 Hàm phụ trợ nội bộ (tái sử dụng code của bạn, đổi tên cho rõ nghĩa)
    public Product getProductEntityById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + id));
    }

    public ProductResponse createProduct(Product product) {
        if (productRepository.existsBySku(product.getSku())) {
            throw new RuntimeException("SKU đã tồn tại. Vui lòng chọn một SKU khác.");
        }
        if (product.getSellingPrice() != null && product.getSellingPrice().doubleValue() < 0) {
            throw new RuntimeException("Giá bán sản phẩm không được là số âm.");
        }

        // 👉 Đảm bảo khi mới tạo luôn là Bản nháp
        if (product.getStatus() == null) {
            product.setStatus(ProductStatus.DRAFT);
        }

        return new ProductResponse(productRepository.save(product));
    }

    public ProductResponse updateProduct(Long id, Product productDetails) {
        // 👉 SỬA LỖI: Dùng hàm getProductEntityById ở trên để tránh lỗi
        Product existingProduct = getProductEntityById(id);

        if(!existingProduct.getSku().equals(productDetails.getSku())
                && productRepository.existsBySku(productDetails.getSku())) {
            throw new RuntimeException("SKU đã tồn tại. Vui lòng chọn một SKU khác.");
        }

        // Bổ sung validate giá bán âm cho lúc Update
        if (productDetails.getSellingPrice() != null && productDetails.getSellingPrice().doubleValue() < 0) {
            throw new RuntimeException("Giá bán sản phẩm không được là số âm.");
        }

        existingProduct.setName(productDetails.getName());
        existingProduct.setSku(productDetails.getSku());
        existingProduct.setSellingPrice(productDetails.getSellingPrice());

        // 👉 BỔ SUNG CẬP NHẬT CÁC TRƯỜNG MỚI
        existingProduct.setUnit(productDetails.getUnit());
        existingProduct.setDescription(productDetails.getDescription());
        if (productDetails.getStatus() != null) {
            existingProduct.setStatus(productDetails.getStatus());
        }

        if(productDetails.getImageUrl() != null) {
            existingProduct.setImageUrl(productDetails.getImageUrl());
        }
        return new ProductResponse(productRepository.save(existingProduct));
    }

    // 👉 CHUYỂN SANG XÓA MỀM (SOFT DELETE) THAY VÌ XÓA CỨNG
    public void deleteProduct(Long id) {
        Product product = getProductEntityById(id);
        // Đổi trạng thái thành DEACTIVATED thay vì xóa hẳn khỏi DB
        product.setStatus(ProductStatus.DEACTIVATED);
        productRepository.save(product);
    }

    public void changeProductStatus(Long id, ProductStatus status) {
        Product product = getProductEntityById(id);
        product.setStatus(status);
        productRepository.save(product);
    }
}