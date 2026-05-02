package com.tuplastic.erp.product.service;

import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.bom.entity.BomItem;
import com.tuplastic.erp.bom.repository.BomItemRepository;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.material.entity.Material;
import com.tuplastic.erp.material.repository.MaterialRepository;
import com.tuplastic.erp.product.dto.CreateCustomProductBomLineRequest;
import com.tuplastic.erp.product.dto.CreateCustomProductRequest;
import com.tuplastic.erp.product.dto.ProductResponse;
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.product.mapper.ProductMapper;
import com.tuplastic.erp.product.repository.ProductRepository;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class CustomCatalogProductService {

    private final ProductRepository productRepository;
    private final AgencyRepository agencyRepository;
    private final MaterialRepository materialRepository;
    private final BomItemRepository bomItemRepository;
    private final ProductMapper productMapper;

    @Transactional
    public ProductResponse createCustomProduct(CreateCustomProductRequest request, User creator) {
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

        for (CreateCustomProductBomLineRequest line : request.getBomItems()) {
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

        return productMapper.toResponse(saved);
    }
}
