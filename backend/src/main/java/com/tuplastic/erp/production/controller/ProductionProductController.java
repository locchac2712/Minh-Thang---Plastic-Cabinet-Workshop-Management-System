package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.bom.dto.BomItemResponse;
import com.tuplastic.erp.bom.service.BomService;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.product.dto.SellerProductResponse;
import com.tuplastic.erp.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/production/products")
@PreAuthorize("hasRole('PRODUCTION')")
@RequiredArgsConstructor
public class ProductionProductController {

    private final ProductService productService;
    private final BomService bomService;

    @GetMapping
    public PageResponse<SellerProductResponse> listProducts(
            @RequestParam(name = "category_id", required = false) UUID categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(name = "is_active", required = false) Boolean isActive,
            @RequestParam(name = "in_stock", required = false) Boolean inStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return productService.getProductionProductCatalog(categoryId, search, isActive, inStock, page, size);
    }

    @GetMapping("/{id}")
    public SellerProductResponse getProduct(@PathVariable UUID id) {
        return productService.getProductByIdForProduction(id);
    }

    @GetMapping("/{productId}/bom")
    public List<BomItemResponse> getBom(@PathVariable UUID productId) {
        return bomService.getBomByProductId(productId);
    }
}
