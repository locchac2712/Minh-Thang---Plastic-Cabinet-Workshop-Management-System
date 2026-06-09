package com.tuplastic.erp.product.service;

import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.bom.dto.CreateBomItemRequest;
import com.tuplastic.erp.bom.dto.UpsertBomRequest;
import com.tuplastic.erp.bom.entity.BomItem;
import com.tuplastic.erp.bom.repository.BomItemRepository;
import com.tuplastic.erp.bom.service.BomService;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.material.entity.Material;
import com.tuplastic.erp.material.repository.MaterialRepository;
import com.tuplastic.erp.product.dto.CreateCustomProductBomLineRequest;
import com.tuplastic.erp.product.dto.CreateCustomProductRequest;
import com.tuplastic.erp.product.dto.ProductionCustomProductResponse;
import com.tuplastic.erp.product.dto.UpdateCustomProductRequest;
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.product.mapper.ProductMapper;
import com.tuplastic.erp.product.repository.ProductRepository;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomCatalogProductService {

    private final ProductRepository productRepository;
    private final AgencyRepository agencyRepository;
    private final MaterialRepository materialRepository;
    private final BomItemRepository bomItemRepository;
    private final ProductMapper productMapper;
    private final BomService bomService;

    @Transactional(readOnly = true)
    public PageResponse<ProductionCustomProductResponse> listCustomProducts(UUID agencyId, String search,
                                                                            int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String q = search == null || search.isBlank() ? null : search.trim();
        Page<Product> productPage = productRepository.findCustomProducts(agencyId, q, pageable);
        return PageResponse.<ProductionCustomProductResponse>builder()
                .content(productPage.getContent().stream().map(this::toCustomResponse).toList())
                .page(productPage.getNumber())
                .size(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .last(productPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public ProductionCustomProductResponse getCustomProduct(UUID id) {
        return toCustomResponse(findCustomProductOrThrow(id));
    }

    @Transactional
    public ProductionCustomProductResponse createCustomProduct(CreateCustomProductRequest request, User creator) {
        if (productRepository.existsBySku(request.getSku())) {
            throw new BadRequestException("Mã SKU đã tồn tại: " + request.getSku());
        }

        Agency agency = agencyRepository.findById(request.getAgencyId())
                .orElseThrow(() -> new ResourceNotFoundException("Đại lý", "id", request.getAgencyId()));

        BigDecimal cost = request.getCostPrice() != null ? request.getCostPrice() : BigDecimal.ZERO;

        Product product = Product.builder()
                .category(null)
                .sku(request.getSku().trim())
                .name(request.getName().trim())
                .imageUrls(request.getImageUrls())
                .costPrice(cost)
                .suggestedPrice(request.getSuggestedPrice())
                .stockQuantity(0)
                .isActive(true)
                .isCustom(true)
                .agency(agency)
                .createdBy(creator)
                .resourceUrl(request.getResourceUrl())
                .build();

        Product saved = productRepository.save(product);
        saveBomLines(saved, request.getBomItems());

        return toCustomResponse(saved);
    }

    @Transactional
    public ProductionCustomProductResponse updateCustomProduct(UUID id, UpdateCustomProductRequest request) {
        Product product = findCustomProductOrThrow(id);

        Agency agency = agencyRepository.findById(request.getAgencyId())
                .orElseThrow(() -> new ResourceNotFoundException("Đại lý", "id", request.getAgencyId()));

        product.setAgency(agency);
        product.setName(request.getName().trim());
        if (request.getImageUrls() != null) {
            product.setImageUrls(request.getImageUrls());
        }
        product.setResourceUrl(request.getResourceUrl());
        if (request.getCostPrice() != null) {
            product.setCostPrice(request.getCostPrice());
        }
        product.setSuggestedPrice(request.getSuggestedPrice());

        Product saved = productRepository.save(product);
        upsertBomFromCustomLines(saved.getId(), request.getBomItems());

        return toCustomResponse(saved);
    }

    private void saveBomLines(Product saved, List<CreateCustomProductBomLineRequest> bomItems) {
        for (CreateCustomProductBomLineRequest line : bomItems) {
            if (line.getQuantity() == null || line.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Số lượng định mức phải > 0 cho mỗi dòng BOM");
            }
            Material material = materialRepository.findById(line.getMaterialId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vật tư", "id", line.getMaterialId()));

            BomItem bom = BomItem.builder()
                    .product(saved)
                    .material(material)
                    .quantity(line.getQuantity())
                    .note(line.getNote())
                    .build();
            bomItemRepository.save(bom);
        }
    }

    private void upsertBomFromCustomLines(UUID productId, List<CreateCustomProductBomLineRequest> bomItems) {
        List<CreateBomItemRequest> lines = new ArrayList<>(bomItems.size());
        for (CreateCustomProductBomLineRequest line : bomItems) {
            if (line.getQuantity() == null || line.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Số lượng định mức phải > 0 cho mỗi dòng BOM");
            }
            CreateBomItemRequest item = new CreateBomItemRequest();
            item.setMaterialId(line.getMaterialId());
            item.setQuantity(line.getQuantity());
            item.setNote(line.getNote());
            lines.add(item);
        }
        bomService.upsertBom(productId, new UpsertBomRequest(lines));
    }

    private Product findCustomProductOrThrow(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm custom", "id", id));
        if (!Boolean.TRUE.equals(product.getIsCustom())) {
            throw new ResourceNotFoundException("Sản phẩm custom", "id", id);
        }
        return product;
    }

    private ProductionCustomProductResponse toCustomResponse(Product product) {
        var base = productMapper.toResponse(product);
        String agencyName = product.getAgency() != null ? product.getAgency().getName() : null;
        return ProductionCustomProductResponse.builder()
                .id(base.getId())
                .categoryId(base.getCategoryId())
                .categoryName(base.getCategoryName())
                .sku(base.getSku())
                .name(base.getName())
                .imageUrls(base.getImageUrls())
                .costPrice(base.getCostPrice())
                .suggestedPrice(base.getSuggestedPrice())
                .stockQuantity(base.getStockQuantity())
                .isActive(base.getIsActive())
                .isCustom(base.getIsCustom())
                .agencyId(base.getAgencyId())
                .agencyName(agencyName)
                .createdById(base.getCreatedById())
                .resourceUrl(base.getResourceUrl())
                .createdAt(base.getCreatedAt())
                .build();
    }
}
