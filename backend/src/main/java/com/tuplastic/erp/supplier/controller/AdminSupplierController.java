package com.tuplastic.erp.supplier.controller;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.material.dto.LinkOneMaterialToSupplierRequest;
import com.tuplastic.erp.material.dto.MaterialResponse;
import com.tuplastic.erp.material.dto.SetSupplierLinkedMaterialsRequest;
import com.tuplastic.erp.material.dto.SetSupplierLinkedMaterialsResult;
import com.tuplastic.erp.material.service.MaterialService;
import com.tuplastic.erp.supplier.dto.CreateSupplierRequest;
import com.tuplastic.erp.supplier.dto.SupplierResponse;
import com.tuplastic.erp.supplier.dto.UpdateSupplierRequest;
import com.tuplastic.erp.supplier.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/suppliers")
@PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR')")
@RequiredArgsConstructor
public class AdminSupplierController {

    private final SupplierService supplierService;
    private final MaterialService materialService;

    @GetMapping
    public PageResponse<SupplierResponse> list(
            @RequestParam(required = false) String search,
            @RequestParam(name = "has_debt", required = false) Boolean hasDebt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return supplierService.listSuppliers(search, hasDebt, page, size);
    }

    @GetMapping("/{id}")
    public SupplierResponse getOne(@PathVariable UUID id) {
        return supplierService.getSupplierById(id);
    }

    /**
     * Vật tư liên kết (M–N) với NCC này.
     */
    @GetMapping("/{id}/materials")
    public PageResponse<MaterialResponse> listLinkedMaterials(
            @PathVariable UUID id,
            @RequestParam(required = false) String search,
            @RequestParam(name = "is_active", required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return materialService.getMaterialsBySupplier(id, search, isActive, page, size);
    }

    /** Thay toàn bộ tập vật tư liên kết với NCC (dùng khi lưu màn hình NVL theo NCC). */
    @PutMapping("/{id}/materials")
    public SetSupplierLinkedMaterialsResult replaceLinkedMaterials(
            @PathVariable UUID id,
            @RequestBody SetSupplierLinkedMaterialsRequest request) {
        return materialService.replaceLinkedMaterialsForSupplier(
                id, request.getMaterialIds());
    }

    /** Gắn thêm một vật tư vào NCC. */
    @PostMapping("/{id}/materials")
    @ResponseStatus(HttpStatus.CREATED)
    public MaterialResponse addLinkedMaterial(
            @PathVariable UUID id,
            @Valid @RequestBody LinkOneMaterialToSupplierRequest request) {
        return materialService.linkMaterialToSupplier(id, request.getMaterialId());
    }

    /** Bỏ liên kết một cặp (NCC, vật tư). */
    @DeleteMapping("/{id}/materials/{materialId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeLinkedMaterial(
            @PathVariable UUID id, @PathVariable UUID materialId) {
        materialService.unlinkMaterialFromSupplier(id, materialId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SupplierResponse create(@Valid @RequestBody CreateSupplierRequest request) {
        return supplierService.createSupplier(request);
    }

    @PatchMapping("/{id}")
    public SupplierResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateSupplierRequest request) {
        return supplierService.updateSupplier(id, request);
    }

    @PatchMapping("/{id}/toggle-active")
    public SupplierResponse toggleActive(@PathVariable UUID id) {
        return supplierService.toggleActive(id);
    }
}
