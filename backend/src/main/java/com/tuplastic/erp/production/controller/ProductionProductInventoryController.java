package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.productinventory.dto.ProductInventoryLogResponse;
import com.tuplastic.erp.production.dto.ProductionProductStockResponse;
import com.tuplastic.erp.production.service.ProductionProductInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/production/product-inventory")
@PreAuthorize("hasRole('PRODUCTION')")
@RequiredArgsConstructor
public class ProductionProductInventoryController {

    private final ProductionProductInventoryService productInventoryService;

    @GetMapping
    public PageResponse<ProductionProductStockResponse> listStock(
            @RequestParam(name = "category_id", required = false) UUID categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(name = "in_stock", required = false) Boolean inStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return productInventoryService.listFinishedGoodsStock(categoryId, search, inStock, page, size);
    }

    @GetMapping("/logs")
    public PageResponse<ProductInventoryLogResponse> listLogs(
            @RequestParam(name = "product_id", required = false) UUID productId,
            @RequestParam(name = "transaction_type", required = false) String transactionType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return productInventoryService.listInventoryLogs(productId, transactionType, page, size);
    }
}
