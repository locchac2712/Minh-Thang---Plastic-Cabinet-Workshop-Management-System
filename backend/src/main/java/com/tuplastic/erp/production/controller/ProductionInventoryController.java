package com.tuplastic.erp.production.controller;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.material.dto.MaterialResponse;
import com.tuplastic.erp.material.service.MaterialService;
import com.tuplastic.erp.production.dto.InventoryLogResponse;
import com.tuplastic.erp.production.dto.LowStockMaterialResponse;
import com.tuplastic.erp.production.dto.ManualInventoryRequest;
import com.tuplastic.erp.production.service.ProductionInventoryService;
import com.tuplastic.erp.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/production")
@PreAuthorize("hasRole('PRODUCTION')")
@RequiredArgsConstructor
public class ProductionInventoryController {

    private final ProductionInventoryService inventoryService;
    private final MaterialService materialService;
    private final SecurityUtils securityUtils;

    /**
     * Danh sách NVL (tồn kho, đơn giá, …) — cùng filter với admin/kế toán, chỉ đọc.
     */
    @GetMapping("/materials")
    public PageResponse<MaterialResponse> listMaterials(
            @RequestParam(required = false) String search,
            @RequestParam(name = "is_active", required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return materialService.getAllMaterials(search, isActive, page, size);
    }

    @GetMapping("/materials/low-stock")
    public List<LowStockMaterialResponse> getLowStockMaterials() {
        return inventoryService.getLowStockMaterials();
    }

    @GetMapping("/materials/{id}")
    public MaterialResponse getMaterial(@PathVariable UUID id) {
        return materialService.getMaterialById(id);
    }

    /**
     * Nhật ký xuất/nhập/hao NVL (toàn hệ thống: PO, AUTO-BOM task, xuất tay, waste).
     */
    @GetMapping("/inventory/logs")
    public PageResponse<InventoryLogResponse> listMaterialInventoryLogs(
            @RequestParam(name = "material_id", required = false) UUID materialId,
            @RequestParam(name = "task_id", required = false) UUID taskId,
            @RequestParam(name = "transaction_type", required = false) String transactionType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return inventoryService.listMaterialInventoryLogs(materialId, taskId, transactionType, page, size);
    }

    @PostMapping("/inventory")
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryLogResponse manualExport(@Valid @RequestBody ManualInventoryRequest request) {
        User worker = securityUtils.getCurrentUser();
        return inventoryService.manualExport(request, worker);
    }

    @PostMapping("/inventory/import")
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryLogResponse manualImport(@Valid @RequestBody ManualInventoryRequest request) {
        User worker = securityUtils.getCurrentUser();
        return inventoryService.manualImport(request, worker);
    }

    @PostMapping("/inventory/waste")
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryLogResponse reportWaste(@Valid @RequestBody ManualInventoryRequest request) {
        User worker = securityUtils.getCurrentUser();
        return inventoryService.reportWaste(request, worker);
    }
}
