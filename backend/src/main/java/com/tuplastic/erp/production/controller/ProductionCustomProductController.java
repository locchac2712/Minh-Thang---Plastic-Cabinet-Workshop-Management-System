package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.product.dto.CreateCustomProductRequest;
import com.tuplastic.erp.product.dto.ProductResponse;
import com.tuplastic.erp.product.service.CustomCatalogProductService;
import com.tuplastic.erp.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/production/custom-products")
@PreAuthorize("hasRole('PRODUCTION')")
@RequiredArgsConstructor
public class ProductionCustomProductController {

    private final CustomCatalogProductService customCatalogProductService;
    private final SecurityUtils securityUtils;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody CreateCustomProductRequest request) {
        User worker = securityUtils.getCurrentUser();
        return customCatalogProductService.createCustomProduct(request, worker);
    }
}
