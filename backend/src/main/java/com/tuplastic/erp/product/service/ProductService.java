package com.tuplastic.erp.product.service;

import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.bom.dto.CreateBomItemRequest;
import com.tuplastic.erp.bom.dto.UpsertBomRequest;
import com.tuplastic.erp.bom.service.BomService;
import com.tuplastic.erp.category.entity.Category;
import com.tuplastic.erp.category.repository.CategoryRepository;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.product.dto.CreateProductRequest;
import com.tuplastic.erp.product.dto.ProductResponse;
import com.tuplastic.erp.product.dto.SellerProductResponse;
import com.tuplastic.erp.product.dto.UpdateProductRequest;
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

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final AgencyRepository agencyRepository;
    private final ProductMapper productMapper;
    private final BomService bomService;

    @Transactional(readOnly = true)
    public ProductResponse getProductById(UUID id) {
        return productMapper.toResponse(findProductOrThrow(id));
    }

    /**
     * Chi tiết cho seller: chỉ sản phẩm đang active (đồng bộ với danh sách mặc định is_active=true).
     */
    @Transactional(readOnly = true)
    public SellerProductResponse getProductByIdForSeller(UUID id) {
        Product product = findProductOrThrow(id);
        if (!Boolean.TRUE.equals(product.getIsActive())) {
            throw new ResourceNotFoundException("Sản phẩm", "id", id);
        }
        return productMapper.toSellerResponse(product);
    }

    /**
     * Catalog read-only cho xưởng (ẩn giá vốn — {@link SellerProductResponse}).
     */
    @Transactional(readOnly = true)
    public PageResponse<SellerProductResponse> getProductionProductCatalog(UUID categoryId, String search,
                                                                           Boolean isActive, Boolean inStock,
                                                                           int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = productRepository.findAllWithFilters(categoryId, search, isActive, inStock, pageable);

        return PageResponse.<SellerProductResponse>builder()
                .content(productPage.getContent().stream().map(productMapper::toSellerResponse).toList())
                .page(productPage.getNumber())
                .size(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .last(productPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public SellerProductResponse getProductByIdForProduction(UUID id) {
        return productMapper.toSellerResponse(findProductOrThrow(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getAllProducts(UUID categoryId, String search, Boolean isActive,
                                                        Boolean inStock, int page, int size) {
        // Native query dùng ORDER BY created_at trong SQL; không dùng Sort camelCase (PostgreSQL báo lỗi createdat).
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = productRepository.findAllWithFilters(categoryId, search, isActive, inStock, pageable);

        return PageResponse.<ProductResponse>builder()
                .content(productPage.getContent().stream().map(productMapper::toResponse).toList())
                .page(productPage.getNumber())
                .size(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .last(productPage.isLast())
                .build();
    }

    /**
     * Danh mục sản phẩm cho seller; thêm {@code agencyId} / {@code isCustom} so với {@link #getAllProducts}.
     * Có {@code agencyId} → chỉ SP gắn đại lý đó; bắt buộc đại lý thuộc seller phụ trách.
     */
    @Transactional(readOnly = true)
    public PageResponse<SellerProductResponse> getSellerProductCatalog(User seller, UUID categoryId, String search,
                                                                       Boolean isActive, Boolean inStock,
                                                                       UUID agencyId, Boolean isCustom,
                                                                       int page, int size) {
        if (agencyId != null) {
            agencyRepository.findByIdAndAssignedSellerId(agencyId, seller.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Đại lý", "id", agencyId));
        }

        Pageable pageable = PageRequest.of(page, size);
        boolean useSellerQuery = agencyId != null
                || Boolean.TRUE.equals(isCustom)
                || Boolean.FALSE.equals(isCustom);
        Page<Product> productPage = useSellerQuery
                ? productRepository.findSellerCatalogWithFilters(
                        seller.getId(), categoryId, search, isActive, inStock, agencyId, isCustom, pageable)
                : productRepository.findAllWithFilters(categoryId, search, isActive, inStock, pageable);

        return PageResponse.<SellerProductResponse>builder()
                .content(productPage.getContent().stream().map(productMapper::toSellerResponse).toList())
                .page(productPage.getNumber())
                .size(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .last(productPage.isLast())
                .build();
    }

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        if (productRepository.existsBySku(request.getSku())) {
            throw new BadRequestException("Mã sản phẩm đã tồn tại: " + request.getSku());
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục", "id", request.getCategoryId()));

        Product product = Product.builder()
                .category(category)
                .sku(request.getSku())
                .name(request.getName())
                .imageUrls(request.getImageUrls())
                .costPrice(request.getCostPrice())
                .suggestedPrice(request.getSuggestedPrice())
                .build();

        Product saved = productRepository.save(product);

        List<CreateBomItemRequest> bomLines = request.getBomItems();
        if (bomLines != null && !bomLines.isEmpty()) {
            bomService.upsertBom(saved.getId(), new UpsertBomRequest(new ArrayList<>(bomLines)));
        }

        return productMapper.toResponse(saved);
    }

    @Transactional
    public ProductResponse updateProduct(UUID id, UpdateProductRequest request) {
        Product product = findProductOrThrow(id);

        if (request.getName() != null) {
            product.setName(request.getName());
        }
        if (request.getImageUrls() != null) {
            product.setImageUrls(request.getImageUrls());
        }
        if (request.getCostPrice() != null) {
            product.setCostPrice(request.getCostPrice());
        }
        if (request.getSuggestedPrice() != null) {
            product.setSuggestedPrice(request.getSuggestedPrice());
        }

        return productMapper.toResponse(productRepository.save(product));
    }

    @Transactional
    public void deactivateProduct(UUID id) {
        Product product = findProductOrThrow(id);
        product.setIsActive(false);
        productRepository.save(product);
    }

    private Product findProductOrThrow(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm", "id", id));
    }
}
