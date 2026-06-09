package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.bom.dto.BomItemResponse;
import com.tuplastic.erp.bom.service.BomService;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.product.dto.CreateCustomProductRequest;
import com.tuplastic.erp.product.dto.ProductionCustomProductResponse;
import com.tuplastic.erp.product.dto.UpdateCustomProductRequest;
import com.tuplastic.erp.product.service.CustomCatalogProductService;
import com.tuplastic.erp.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/production/custom-products")
@PreAuthorize("hasRole('PRODUCTION')")
@RequiredArgsConstructor
public class ProductionCustomProductController {

    private final CustomCatalogProductService customCatalogProductService;
    private final BomService bomService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public PageResponse<ProductionCustomProductResponse> list(
            @RequestParam(name = "agency_id", required = false) UUID agencyId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return customCatalogProductService.listCustomProducts(agencyId, search, page, size);
    }

    @GetMapping("/{id}")
    public ProductionCustomProductResponse getById(@PathVariable UUID id) {
        return customCatalogProductService.getCustomProduct(id);
    }

    @GetMapping("/{id}/bom")
    public List<BomItemResponse> getBom(@PathVariable UUID id) {
        customCatalogProductService.getCustomProduct(id);
        return bomService.getBomByProductId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductionCustomProductResponse create(@Valid @RequestBody CreateCustomProductRequest request) {
        User worker = securityUtils.getCurrentUser();
        return customCatalogProductService.createCustomProduct(request, worker);
    }

    @PutMapping("/{id}")
    public ProductionCustomProductResponse update(@PathVariable UUID id,
                                                  @Valid @RequestBody UpdateCustomProductRequest request) {
        return customCatalogProductService.updateCustomProduct(id, request);
    }
}
