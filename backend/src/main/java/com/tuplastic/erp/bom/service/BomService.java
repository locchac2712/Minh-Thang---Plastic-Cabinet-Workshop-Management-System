package com.tuplastic.erp.bom.service;

import com.tuplastic.erp.bom.dto.BomItemResponse;
import com.tuplastic.erp.bom.dto.CreateBomItemRequest;
import com.tuplastic.erp.bom.dto.UpdateBomItemRequest;
import com.tuplastic.erp.bom.dto.UpsertBomRequest;
import com.tuplastic.erp.bom.entity.BomItem;
import com.tuplastic.erp.bom.mapper.BomItemMapper;
import com.tuplastic.erp.bom.repository.BomItemRepository;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.material.entity.Material;
import com.tuplastic.erp.material.repository.MaterialRepository;
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BomService {

    private final BomItemRepository bomItemRepository;
    private final ProductRepository productRepository;
    private final MaterialRepository materialRepository;
    private final BomItemMapper bomItemMapper;

    @Transactional(readOnly = true)
    public List<BomItemResponse> getBomByProductId(UUID productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Sản phẩm", "id", productId);
        }
        return bomItemRepository.findByProductIdWithMaterialOrderByCreatedAtAsc(productId)
                .stream().map(bomItemMapper::toResponse).toList();
    }

    /** Seller: chỉ xem BOM khi sản phẩm đang active (đồng bộ với chi tiết SP seller). */
    @Transactional(readOnly = true)
    public List<BomItemResponse> getBomForSellerProduct(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm", "id", productId));
        if (!Boolean.TRUE.equals(product.getIsActive())) {
            throw new ResourceNotFoundException("Sản phẩm", "id", productId);
        }
        return bomItemRepository.findByProductIdWithMaterialOrderByCreatedAtAsc(productId).stream()
                .map(bomItemMapper::toResponse)
                .toList();
    }

    /**
     * Ghi đè toàn bộ BOM của sản phẩm: xóa các dòng hiện có, tạo lại theo {@code request.items}
     * (một vật tư chỉ một dòng; trùng {@code materialId} trong request → 400).
     */
    @Transactional
    public List<BomItemResponse> upsertBom(UUID productId, UpsertBomRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm", "id", productId));

        List<CreateBomItemRequest> lines = request.getItems() == null ? List.of() : request.getItems();
        Set<UUID> seenMaterials = new HashSet<>();
        for (CreateBomItemRequest line : lines) {
            if (!seenMaterials.add(line.getMaterialId())) {
                throw new BadRequestException("Trùng vật tư trong danh sách BOM: " + line.getMaterialId());
            }
        }

        bomItemRepository.deleteByProduct_Id(productId);
        bomItemRepository.flush();

        List<BomItem> toSave = new ArrayList<>(lines.size());
        for (CreateBomItemRequest line : lines) {
            Material material = materialRepository.findById(line.getMaterialId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vật tư", "id", line.getMaterialId()));
            toSave.add(BomItem.builder()
                    .product(product)
                    .material(material)
                    .quantity(line.getQuantity())
                    .note(line.getNote())
                    .build());
        }
        bomItemRepository.saveAll(toSave);

        return bomItemRepository.findByProductIdWithMaterialOrderByCreatedAtAsc(productId).stream()
                .map(bomItemMapper::toResponse)
                .toList();
    }

    @Transactional
    public BomItemResponse addBomItem(UUID productId, CreateBomItemRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm", "id", productId));

        Material material = materialRepository.findById(request.getMaterialId())
                .orElseThrow(() -> new ResourceNotFoundException("Vật tư", "id", request.getMaterialId()));

        if (bomItemRepository.existsByProductIdAndMaterialId(productId, request.getMaterialId())) {
            throw new BadRequestException("Vật tư '" + material.getName() + "' đã có trong công thức sản phẩm này");
        }

        BomItem bomItem = BomItem.builder()
                .product(product)
                .material(material)
                .quantity(request.getQuantity())
                .note(request.getNote())
                .build();

        return bomItemMapper.toResponse(bomItemRepository.save(bomItem));
    }

    @Transactional
    public BomItemResponse updateBomItem(UUID bomId, UpdateBomItemRequest request) {
        BomItem bomItem = bomItemRepository.findById(bomId)
                .orElseThrow(() -> new ResourceNotFoundException("BOM Item", "id", bomId));

        if (request.getQuantity() != null) {
            bomItem.setQuantity(request.getQuantity());
        }
        if (request.getNote() != null) {
            bomItem.setNote(request.getNote());
        }

        return bomItemMapper.toResponse(bomItemRepository.save(bomItem));
    }

    @Transactional
    public void deleteBomItem(UUID bomId) {
        if (!bomItemRepository.existsById(bomId)) {
            throw new ResourceNotFoundException("BOM Item", "id", bomId);
        }
        bomItemRepository.deleteById(bomId);
    }
}
