package com.tuplastic.erp.production.service;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.BusinessLogicException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.inventory.entity.InventoryLog;
import com.tuplastic.erp.inventory.enums.TransactionType;
import com.tuplastic.erp.inventory.repository.InventoryLogRepository;
import com.tuplastic.erp.material.entity.Material;
import com.tuplastic.erp.material.repository.MaterialRepository;
import com.tuplastic.erp.production.dto.InventoryLogResponse;
import com.tuplastic.erp.production.dto.LowStockMaterialResponse;
import com.tuplastic.erp.production.dto.ManualInventoryRequest;
import com.tuplastic.erp.production.entity.ProductionTask;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductionInventoryService {

    private static final Set<String> ALLOWED_LOG_TYPES = Set.of("IMPORT", "EXPORT", "WASTE");

    private final MaterialRepository materialRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final ProductionTaskRepository productionTaskRepository;
    private final ProductionTaskService productionTaskService;

    @Transactional(readOnly = true)
    public PageResponse<InventoryLogResponse> listMaterialInventoryLogs(
            UUID materialId, String taskIdOrCode, String transactionType, int page, int size) {
        String typeFilter = null;
        if (StringUtils.hasText(transactionType)) {
            String upper = transactionType.trim().toUpperCase();
            if (!ALLOWED_LOG_TYPES.contains(upper)) {
                throw new BadRequestException(
                        "transaction_type không hợp lệ. Chỉ chấp nhận: IMPORT, EXPORT, WASTE");
            }
            typeFilter = upper;
        }

        UUID taskId = null;
        if (StringUtils.hasText(taskIdOrCode)) {
            taskId = productionTaskService.resolveTaskId(taskIdOrCode.trim());
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<InventoryLog> logPage = inventoryLogRepository.findWithFilters(
                materialId, taskId, typeFilter, pageable);

        return PageResponse.<InventoryLogResponse>builder()
                .content(logPage.getContent().stream().map(this::toInventoryLogResponse).toList())
                .page(logPage.getNumber())
                .size(logPage.getSize())
                .totalElements(logPage.getTotalElements())
                .totalPages(logPage.getTotalPages())
                .last(logPage.isLast())
                .build();
    }

    private InventoryLogResponse toInventoryLogResponse(InventoryLog l) {
        return InventoryLogResponse.builder()
                .id(l.getId())
                .materialId(l.getMaterial().getId())
                .materialName(l.getMaterial().getName())
                .taskId(l.getTask() != null ? l.getTask().getId() : null)
                .taskDisplayCode(l.getTask() != null ? l.getTask().getDisplayCode() : null)
                .purchaseId(l.getPurchaseId())
                .createdByName(l.getCreatedBy() != null ? l.getCreatedBy().getFullName() : null)
                .transactionType(l.getTransactionType())
                .transactionTypeLabel(TransactionType.labelOf(l.getTransactionType()))
                .quantityChange(l.getQuantityChange())
                .unitPriceAtTime(l.getUnitPriceAtTime())
                .note(l.getNote())
                .createdAt(l.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<LowStockMaterialResponse> getLowStockMaterials() {
        return materialRepository.findLowStock().stream()
                .map(m -> LowStockMaterialResponse.builder()
                        .id(m.getId())
                        .code(m.getCode())
                        .name(m.getName())
                        .unit(m.getUnit())
                        .stockQuantity(m.getStockQuantity())
                        .minStockLevel(m.getMinStockLevel())
                        .build())
                .toList();
    }

    @Transactional
    public InventoryLogResponse manualExport(ManualInventoryRequest request, User currentUser) {
        return processManualDeduction(request, "EXPORT", currentUser);
    }

    @Transactional
    public InventoryLogResponse reportWaste(ManualInventoryRequest request, User currentUser) {
        return processManualDeduction(request, "WASTE", currentUser);
    }

    /**
     * Nhập kho NVL thủ công ({@code IMPORT}); {@code quantityChange} phải dương.
     */
    @Transactional
    public InventoryLogResponse manualImport(ManualInventoryRequest request, User currentUser) {
        Material material = materialRepository.findById(request.getMaterialId())
                .orElseThrow(() -> new ResourceNotFoundException("Vật tư", "id", request.getMaterialId()));

        BigDecimal qty = request.getQuantityChange();
        if (qty.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Số lượng nhập phải lớn hơn 0.");
        }

        material.setStockQuantity(material.getStockQuantity().add(qty));
        materialRepository.save(material);

        ProductionTask task = null;
        if (request.getTaskId() != null) {
            task = productionTaskRepository.findById(request.getTaskId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lệnh sản xuất", "id", request.getTaskId()));
        }

        InventoryLog log = InventoryLog.builder()
                .material(material)
                .task(task)
                .createdBy(currentUser)
                .transactionType("IMPORT")
                .quantityChange(qty)
                .unitPriceAtTime(material.getUnitCost())
                .note(request.getNote())
                .build();

        InventoryLog saved = inventoryLogRepository.save(log);

        return InventoryLogResponse.builder()
                .id(saved.getId())
                .materialId(material.getId())
                .materialName(material.getName())
                .taskId(task != null ? task.getId() : null)
                .taskDisplayCode(task != null ? task.getDisplayCode() : null)
                .purchaseId(saved.getPurchaseId())
                .createdByName(currentUser.getFullName())
                .transactionType(saved.getTransactionType())
                .transactionTypeLabel(TransactionType.labelOf(saved.getTransactionType()))
                .quantityChange(saved.getQuantityChange())
                .unitPriceAtTime(saved.getUnitPriceAtTime())
                .note(saved.getNote())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    private InventoryLogResponse processManualDeduction(ManualInventoryRequest request, String type, User currentUser) {
        Material material = materialRepository.findById(request.getMaterialId())
                .orElseThrow(() -> new ResourceNotFoundException("Vật tư", "id", request.getMaterialId()));

        BigDecimal qty = request.getQuantityChange();
        if (qty.compareTo(BigDecimal.ZERO) >= 0) {
            throw new BadRequestException("Số lượng phải là số âm (trừ kho)");
        }

        BigDecimal absQty = qty.abs();
        if (material.getStockQuantity().compareTo(absQty) < 0) {
            throw new BusinessLogicException(
                    String.format("Kho không đủ '%s' (%s). Cần trừ: %s, Có: %s",
                            material.getName(), material.getCode(),
                            absQty.toPlainString(), material.getStockQuantity().toPlainString()));
        }

        material.setStockQuantity(material.getStockQuantity().add(qty));
        materialRepository.save(material);

        ProductionTask task = null;
        if (request.getTaskId() != null) {
            task = productionTaskRepository.findById(request.getTaskId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lệnh sản xuất", "id", request.getTaskId()));
        }

        InventoryLog log = InventoryLog.builder()
                .material(material)
                .task(task)
                .createdBy(currentUser)
                .transactionType(type)
                .quantityChange(qty)
                .unitPriceAtTime(material.getUnitCost())
                .note(request.getNote())
                .build();

        InventoryLog saved = inventoryLogRepository.save(log);

        return InventoryLogResponse.builder()
                .id(saved.getId())
                .materialId(material.getId())
                .materialName(material.getName())
                .taskId(task != null ? task.getId() : null)
                .taskDisplayCode(task != null ? task.getDisplayCode() : null)
                .purchaseId(saved.getPurchaseId())
                .createdByName(currentUser.getFullName())
                .transactionType(saved.getTransactionType())
                .transactionTypeLabel(TransactionType.labelOf(saved.getTransactionType()))
                .quantityChange(saved.getQuantityChange())
                .unitPriceAtTime(saved.getUnitPriceAtTime())
                .note(saved.getNote())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}
