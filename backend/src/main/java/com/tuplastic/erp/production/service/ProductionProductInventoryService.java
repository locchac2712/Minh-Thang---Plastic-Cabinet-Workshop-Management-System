package com.tuplastic.erp.production.service;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.product.repository.ProductRepository;
import com.tuplastic.erp.productinventory.dto.ProductInventoryLogResponse;
import com.tuplastic.erp.productinventory.entity.ProductInventoryLog;
import com.tuplastic.erp.productinventory.repository.ProductInventoryLogRepository;
import com.tuplastic.erp.production.dto.ProductionProductStockResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductionProductInventoryService {

    private static final Set<String> ALLOWED_LOG_TYPES = Set.of("IMPORT", "EXPORT", "WASTE");

    private final ProductRepository productRepository;
    private final ProductInventoryLogRepository productInventoryLogRepository;

    @Transactional(readOnly = true)
    public PageResponse<ProductionProductStockResponse> listFinishedGoodsStock(
            UUID categoryId, String search, Boolean inStock, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = productRepository.findAllWithFilters(
                categoryId, search, true, inStock, pageable);

        return PageResponse.<ProductionProductStockResponse>builder()
                .content(productPage.getContent().stream().map(this::toStockRow).toList())
                .page(productPage.getNumber())
                .size(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .last(productPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductInventoryLogResponse> listInventoryLogs(
            UUID productId, String transactionType, int page, int size) {
        String typeFilter = null;
        if (StringUtils.hasText(transactionType)) {
            String upper = transactionType.trim().toUpperCase();
            if (!ALLOWED_LOG_TYPES.contains(upper)) {
                throw new BadRequestException(
                        "transaction_type không hợp lệ. Chỉ chấp nhận: IMPORT, EXPORT, WASTE");
            }
            typeFilter = upper;
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ProductInventoryLog> logPage = productInventoryLogRepository.findWithFilters(
                productId, typeFilter, pageable);

        return PageResponse.<ProductInventoryLogResponse>builder()
                .content(logPage.getContent().stream().map(this::toLogResponse).toList())
                .page(logPage.getNumber())
                .size(logPage.getSize())
                .totalElements(logPage.getTotalElements())
                .totalPages(logPage.getTotalPages())
                .last(logPage.isLast())
                .build();
    }

    private ProductionProductStockResponse toStockRow(Product p) {
        return ProductionProductStockResponse.builder()
                .id(p.getId())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .sku(p.getSku())
                .name(p.getName())
                .imageUrls(p.getImageUrls())
                .stockQuantity(p.getStockQuantity())
                .isActive(p.getIsActive())
                .build();
    }

    private ProductInventoryLogResponse toLogResponse(ProductInventoryLog l) {
        Product p = l.getProduct();
        return ProductInventoryLogResponse.builder()
                .id(l.getId())
                .productId(p.getId())
                .productName(p.getName())
                .productSku(p.getSku())
                .orderId(l.getOrder() != null ? l.getOrder().getId() : null)
                .taskId(l.getTask() != null ? l.getTask().getId() : null)
                .createdByName(l.getCreatedBy() != null ? l.getCreatedBy().getFullName() : null)
                .transactionType(l.getTransactionType())
                .quantityChange(l.getQuantityChange())
                .note(l.getNote())
                .createdAt(l.getCreatedAt())
                .build();
    }
}
