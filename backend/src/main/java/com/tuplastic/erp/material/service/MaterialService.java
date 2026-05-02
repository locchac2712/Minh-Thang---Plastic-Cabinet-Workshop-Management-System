package com.tuplastic.erp.material.service;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.material.dto.CreateMaterialRequest;
import com.tuplastic.erp.material.dto.MaterialResponse;
import com.tuplastic.erp.material.dto.MaterialSupplierItem;
import com.tuplastic.erp.material.dto.SetSupplierLinkedMaterialsResult;
import com.tuplastic.erp.material.dto.UpdateMaterialRequest;
import com.tuplastic.erp.material.entity.Material;
import com.tuplastic.erp.material.mapper.MaterialMapper;
import com.tuplastic.erp.material.repository.MaterialRepository;
import com.tuplastic.erp.supplier.entity.Supplier;
import com.tuplastic.erp.supplier.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final MaterialMapper materialMapper;
    private final SupplierRepository supplierRepository;

    @Transactional(readOnly = true)
    public MaterialResponse getMaterialById(UUID id) {
        Material material = materialRepository.findByIdWithSuppliers(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vật tư", "id", id));
        return toDetailResponse(material);
    }

    @Transactional(readOnly = true)
    public PageResponse<MaterialResponse> getAllMaterials(String search, Boolean isActive, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Material> materialPage = materialRepository.findAllWithFilters(search, isActive, pageable);
        List<Material> content = materialPage.getContent();
        if (content.isEmpty()) {
            return PageResponse.<MaterialResponse>builder()
                    .content(List.of())
                    .page(materialPage.getNumber())
                    .size(materialPage.getSize())
                    .totalElements(materialPage.getTotalElements())
                    .totalPages(materialPage.getTotalPages())
                    .last(materialPage.isLast())
                    .build();
        }
        List<UUID> ids = content.stream().map(Material::getId).toList();
        Map<UUID, Long> countById = linkedSupplierCountsByMaterialIds(ids);
        return PageResponse.<MaterialResponse>builder()
                .content(content.stream()
                        .map(m -> toListResponse(m, countById.getOrDefault(m.getId(), 0L)))
                        .toList())
                .page(materialPage.getNumber())
                .size(materialPage.getSize())
                .totalElements(materialPage.getTotalElements())
                .totalPages(materialPage.getTotalPages())
                .last(materialPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<MaterialResponse> getMaterialsBySupplier(
            UUID supplierId, String search, Boolean isActive, int page, int size) {
        if (!supplierRepository.existsById(supplierId)) {
            throw new ResourceNotFoundException("Nhà cung cấp", "id", supplierId);
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Material> materialPage = materialRepository.findBySupplierIdWithFilters(
                supplierId, search, isActive, pageable);
        List<Material> content = materialPage.getContent();
        if (content.isEmpty()) {
            return PageResponse.<MaterialResponse>builder()
                    .content(List.of())
                    .page(materialPage.getNumber())
                    .size(materialPage.getSize())
                    .totalElements(materialPage.getTotalElements())
                    .totalPages(materialPage.getTotalPages())
                    .last(materialPage.isLast())
                    .build();
        }
        List<UUID> ids = content.stream().map(Material::getId).toList();
        Map<UUID, Long> countById = linkedSupplierCountsByMaterialIds(ids);
        return PageResponse.<MaterialResponse>builder()
                .content(content.stream()
                        .map(m -> toListResponse(m, countById.getOrDefault(m.getId(), 0L)))
                        .toList())
                .page(materialPage.getNumber())
                .size(materialPage.getSize())
                .totalElements(materialPage.getTotalElements())
                .totalPages(materialPage.getTotalPages())
                .last(materialPage.isLast())
                .build();
    }

    /**
     * Đồng bộ tập vật tư gắn với NCC (thay thế toàn bộ; danh sách rỗng = gỡ hết).
     */
    @Transactional
    public SetSupplierLinkedMaterialsResult replaceLinkedMaterialsForSupplier(
            UUID supplierId, List<UUID> requestedMaterialIds) {
        Supplier supplier = requireSupplierForLinking(supplierId);
        List<UUID> distinct = requestedMaterialIds == null
                ? List.of()
                : requestedMaterialIds.stream().distinct().toList();
        for (UUID mid : distinct) {
            if (!materialRepository.existsById(mid)) {
                throw new ResourceNotFoundException("Vật tư", "id", mid);
            }
        }
        Set<UUID> wanted = new HashSet<>(distinct);
        Set<UUID> current = new HashSet<>(materialRepository.findMaterialIdsBySupplierId(supplierId));
        for (UUID mid : current) {
            if (!wanted.contains(mid)) {
                Material m = materialRepository.findByIdWithSuppliers(mid)
                        .orElseThrow(() -> new ResourceNotFoundException("Vật tư", "id", mid));
                m.getSuppliers().removeIf(s -> s.getId().equals(supplierId));
                materialRepository.save(m);
            }
        }
        for (UUID mid : wanted) {
            if (!current.contains(mid)) {
                Material m = materialRepository.findByIdWithSuppliers(mid)
                        .orElseThrow(() -> new ResourceNotFoundException("Vật tư", "id", mid));
                if (m.getSuppliers().stream().noneMatch(s -> s.getId().equals(supplierId))) {
                    m.getSuppliers().add(supplier);
                }
                materialRepository.save(m);
            }
        }
        List<UUID> after = materialRepository.findMaterialIdsBySupplierId(supplierId);
        return SetSupplierLinkedMaterialsResult.builder()
                .materialIds(after)
                .linkedCount(after.size())
                .build();
    }

    /** Gắn thêm một vật tư; idempotent nếu đã tồn tại. */
    @Transactional
    public MaterialResponse linkMaterialToSupplier(UUID supplierId, UUID materialId) {
        Supplier supplier = requireSupplierForLinking(supplierId);
        if (!materialRepository.existsById(materialId)) {
            throw new ResourceNotFoundException("Vật tư", "id", materialId);
        }
        Material m = materialRepository.findByIdWithSuppliers(materialId).orElseThrow();
        if (m.getSuppliers().stream().noneMatch(s -> s.getId().equals(supplierId))) {
            m.getSuppliers().add(supplier);
            m = materialRepository.save(m);
        }
        final Material mRef = m;
        return materialRepository.findByIdWithSuppliers(mRef.getId())
                .map(this::toDetailResponse)
                .orElseGet(() -> toDetailResponse(mRef));
    }

    /** Bỏ liên kết một cặp (NCC, vật tư). */
    @Transactional
    public void unlinkMaterialFromSupplier(UUID supplierId, UUID materialId) {
        if (!supplierRepository.existsById(supplierId)) {
            throw new ResourceNotFoundException("Nhà cung cấp", "id", supplierId);
        }
        Material m = materialRepository.findByIdWithSuppliers(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Vật tư", "id", materialId));
        m.getSuppliers().removeIf(s -> s.getId().equals(supplierId));
        materialRepository.save(m);
    }

    private Supplier requireSupplierForLinking(UUID supplierId) {
        Supplier s = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhà cung cấp", "id", supplierId));
        if (Boolean.FALSE.equals(s.getIsActive())) {
            throw new BadRequestException("Không cập nhật liên kết khi nhà cung cấp đang bị khóa (inactive).");
        }
        return s;
    }

    private Map<UUID, Long> linkedSupplierCountsByMaterialIds(List<UUID> materialIds) {
        List<Object[]> rows = materialRepository.countLinkedSuppliersByMaterialIds(materialIds);
        Map<UUID, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        for (UUID id : materialIds) {
            map.putIfAbsent(id, 0L);
        }
        return map;
    }

    @Transactional
    public MaterialResponse createMaterial(CreateMaterialRequest request) {
        if (materialRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Mã vật tư đã tồn tại: " + request.getCode());
        }

        Material material = Material.builder()
                .code(request.getCode())
                .name(request.getName())
                .imageUrl(request.getImageUrl())
                .unit(request.getUnit())
                .minStockLevel(request.getMinStockLevel() != null ? request.getMinStockLevel() : BigDecimal.ZERO)
                .build();

        material = materialRepository.save(material);
        if (request.getSupplierIds() != null && !request.getSupplierIds().isEmpty()) {
            replaceSuppliers(material, request.getSupplierIds());
            material = materialRepository.save(material);
        }
        final Material materialForResponse = material;
        return materialRepository.findByIdWithSuppliers(materialForResponse.getId())
                .map(this::toDetailResponse)
                .orElseGet(() -> toDetailResponse(materialForResponse));
    }

    @Transactional
    public MaterialResponse updateMaterial(UUID id, UpdateMaterialRequest request) {
        Material material = findMaterialOrThrow(id);

        if (request.getName() != null) {
            material.setName(request.getName());
        }
        if (request.getImageUrl() != null) {
            material.setImageUrl(request.getImageUrl());
        }
        if (request.getUnit() != null) {
            material.setUnit(request.getUnit());
        }
        if (request.getMinStockLevel() != null) {
            material.setMinStockLevel(request.getMinStockLevel());
        }
        if (request.getIsActive() != null) {
            material.setIsActive(request.getIsActive());
        }
        if (request.getSupplierIds() != null) {
            replaceSuppliers(material, request.getSupplierIds());
        }

        material = materialRepository.save(material);
        final Material materialForResponse = material;
        return materialRepository.findByIdWithSuppliers(materialForResponse.getId())
                .map(this::toDetailResponse)
                .orElseGet(() -> toDetailResponse(materialForResponse));
    }

    @Transactional
    public void deactivateMaterial(UUID id) {
        Material material = findMaterialOrThrow(id);
        material.setIsActive(false);
        materialRepository.save(material);
    }

    private void replaceSuppliers(Material material, List<UUID> supplierIds) {
        material.getSuppliers().clear();
        if (supplierIds == null || supplierIds.isEmpty()) {
            return;
        }
        for (UUID sid : supplierIds.stream().distinct().toList()) {
            Supplier s = supplierRepository.findById(sid)
                    .orElseThrow(() -> new ResourceNotFoundException("Nhà cung cấp", "id", sid));
            if (Boolean.FALSE.equals(s.getIsActive())) {
                throw new BadRequestException("Nhà cung cấp '" + s.getName() + "' đang bị khóa (inactive).");
            }
            material.getSuppliers().add(s);
        }
    }

    private MaterialResponse toListResponse(Material m, long linkedCount) {
        MaterialResponse r = materialMapper.toResponse(m);
        r.setLinkedSuppliers(null);
        r.setLinkedSupplierCount(linkedCount);
        return r;
    }

    private MaterialResponse toDetailResponse(Material m) {
        MaterialResponse r = materialMapper.toResponse(m);
        List<MaterialSupplierItem> items = m.getSuppliers().stream()
                .map(s -> MaterialSupplierItem.builder().id(s.getId()).name(s.getName()).build())
                .sorted(Comparator.comparing(MaterialSupplierItem::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
        r.setLinkedSuppliers(items);
        r.setLinkedSupplierCount((long) m.getSuppliers().size());
        return r;
    }

    private Material findMaterialOrThrow(UUID id) {
        return materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vật tư", "id", id));
    }
}
