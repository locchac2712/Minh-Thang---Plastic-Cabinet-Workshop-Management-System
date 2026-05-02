package com.tuplastic.erp.product.controller;

import com.tuplastic.erp.bom.dto.BomItemResponse;
import com.tuplastic.erp.bom.service.BomService;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.product.dto.SellerProductResponse;
import com.tuplastic.erp.product.service.ProductService;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/seller/products")
@PreAuthorize("hasRole('SELLER')")
@RequiredArgsConstructor
public class SellerProductController {

    private final ProductService productService;
    private final BomService bomService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public PageResponse<SellerProductResponse> getProducts(
            @RequestParam(name = "category_id", required = false) UUID categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(name = "is_active", required = false, defaultValue = "true") Boolean isActive,
            @RequestParam(name = "in_stock", required = false) Boolean inStock,
            @RequestParam(name = "agency_id", required = false) UUID agencyId,
            @RequestParam(name = "is_custom", required = false) Boolean isCustom,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User seller = securityUtils.getCurrentUser();
        return productService.getSellerProductCatalog(
                seller, categoryId, search, isActive, inStock, agencyId, isCustom, page, size);
    }

    @GetMapping("/{productId}/bom")
    public List<BomItemResponse> getProductBom(@PathVariable UUID productId) {
        return bomService.getBomForSellerProduct(productId);
    }

    @GetMapping("/{id}")
    public SellerProductResponse getProduct(@PathVariable UUID id) {
        return productService.getProductByIdForSeller(id);
    }
}
