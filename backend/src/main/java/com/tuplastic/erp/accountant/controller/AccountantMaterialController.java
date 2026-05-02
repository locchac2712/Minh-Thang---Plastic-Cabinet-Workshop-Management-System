package com.tuplastic.erp.accountant.controller;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.material.dto.MaterialResponse;
import com.tuplastic.erp.material.service.MaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Danh sách vật tư cho Kế toán (phiếu mua hàng). Read-only, dùng chung logic với Admin.
 */
@RestController
@RequestMapping("/api/accountant/materials")
@PreAuthorize("hasRole('ACCOUNTANT')")
@RequiredArgsConstructor
public class AccountantMaterialController {

    private final MaterialService materialService;

    @GetMapping
    public PageResponse<MaterialResponse> listMaterials(
            @RequestParam(required = false) String search,
            @RequestParam(name = "is_active", required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return materialService.getAllMaterials(search, isActive, page, size);
    }

    @GetMapping("/{id}")
    public MaterialResponse getMaterial(@PathVariable UUID id) {
        return materialService.getMaterialById(id);
    }
}
