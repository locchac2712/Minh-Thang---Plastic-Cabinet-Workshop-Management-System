package com.tuplastic.erp.material.controller;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.material.dto.CreateMaterialRequest;
import com.tuplastic.erp.material.dto.MaterialResponse;
import com.tuplastic.erp.material.dto.UpdateMaterialRequest;
import com.tuplastic.erp.material.service.MaterialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/materials")
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR')")
    public PageResponse<MaterialResponse> getAllMaterials(
            @RequestParam(required = false) String search,
            @RequestParam(name = "is_active", required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return materialService.getAllMaterials(search, isActive, page, size);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR')")
    public MaterialResponse getMaterial(@PathVariable UUID id) {
        return materialService.getMaterialById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public MaterialResponse createMaterial(@Valid @RequestBody CreateMaterialRequest request) {
        return materialService.createMaterial(request);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public MaterialResponse updateMaterial(@PathVariable UUID id,
                                           @Valid @RequestBody UpdateMaterialRequest request) {
        return materialService.updateMaterial(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deactivateMaterial(@PathVariable UUID id) {
        materialService.deactivateMaterial(id);
    }
}
