package com.pcwms.backend.controller;

import com.pcwms.backend.dto.response.ProductResponse;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.entity.Product;
import com.pcwms.backend.entity.ProductStatus;
import com.pcwms.backend.services.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    // Xem danh sách: Ai đăng nhập cũng xem được
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseObject> getAllProducts() {
        List<ProductResponse> products = productService.getAllProducts();
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Lấy danh sách thành phẩm thành công",
                        productService.getAllProducts())
        );
    }

    // Xem chi tiết
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseObject> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Lấy chi tiết thành phẩm thành công",
                        productService.getProductDetail(id))
        );
    }

    // Tạo mới: Chỉ Quản đốc, Admin, Giám đốc được tạo
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('PRODUCTION_MANAGER')")
    public ResponseEntity<ResponseObject> createProduct(@RequestBody Product product) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Thêm thành phẩm thành công",
                        productService.createProduct(product))
        );
    }

    // Cập nhật
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('PRODUCTION_MANAGER')")
    public ResponseEntity<ResponseObject> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Cập nhật thành phẩm thành công",
                        productService.updateProduct(id, product))
        );
    }

    // Thay đổi trạng thái nhanh (Ví dụ: Chuyển sang DEACTIVATED để ngừng bán)
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('PRODUCTION_MANAGER')")
    public ResponseEntity<ResponseObject> changeStatus(@PathVariable Long id, @RequestParam ProductStatus status) {
        productService.changeProductStatus(id, status);
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Cập nhật trạng thái thành công", null)
        );
    }
}