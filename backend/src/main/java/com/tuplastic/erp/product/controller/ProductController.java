package com.tuplastic.erp.product.controller;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.product.dto.CreateProductRequest;
import com.tuplastic.erp.product.dto.ProductResponse;
import com.tuplastic.erp.product.dto.UpdateProductRequest;
import com.tuplastic.erp.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public PageResponse<ProductResponse> getAllProducts(
            @RequestParam(name = "category_id", required = false) UUID categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(name = "is_active", required = false) Boolean isActive,
            @RequestParam(name = "in_stock", required = false) Boolean inStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return productService.getAllProducts(categoryId, search, isActive, inStock, page, size);
    }

    @GetMapping("/{id}")
    public ProductResponse getProduct(@PathVariable UUID id) {
        return productService.getProductById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse createProduct(@Valid @RequestBody CreateProductRequest request) {
        return productService.createProduct(request);
    }

    @PutMapping("/{id}")
    public ProductResponse updateProduct(@PathVariable UUID id,
                                         @Valid @RequestBody UpdateProductRequest request) {
        return productService.updateProduct(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateProduct(@PathVariable UUID id) {
        productService.deactivateProduct(id);
    }
}
