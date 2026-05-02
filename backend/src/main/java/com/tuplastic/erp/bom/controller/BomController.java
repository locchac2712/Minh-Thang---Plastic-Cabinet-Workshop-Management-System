package com.tuplastic.erp.bom.controller;

import com.tuplastic.erp.bom.dto.BomItemResponse;
import com.tuplastic.erp.bom.dto.CreateBomItemRequest;
import com.tuplastic.erp.bom.dto.UpdateBomItemRequest;
import com.tuplastic.erp.bom.dto.UpsertBomRequest;
import com.tuplastic.erp.bom.service.BomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class BomController {

    private final BomService bomService;

    @GetMapping("/products/{productId}/bom")
    public List<BomItemResponse> getBomByProduct(@PathVariable UUID productId) {
        return bomService.getBomByProductId(productId);
    }

    @PostMapping("/products/{productId}/bom")
    @ResponseStatus(HttpStatus.CREATED)
    public BomItemResponse addBomItem(@PathVariable UUID productId,
                                      @Valid @RequestBody CreateBomItemRequest request) {
        return bomService.addBomItem(productId, request);
    }

    /**
     * Bulk: thay toàn bộ BOM của sản phẩm (body gồm {@code items}; [] = xóa hết dòng BOM).
     */
    @PutMapping("/products/{productId}/bom")
    public List<BomItemResponse> upsertBom(@PathVariable UUID productId,
                                           @Valid @RequestBody UpsertBomRequest request) {
        return bomService.upsertBom(productId, request);
    }

    @PatchMapping("/bom/{bomId}")
    public BomItemResponse updateBomItem(@PathVariable UUID bomId,
                                         @Valid @RequestBody UpdateBomItemRequest request) {
        return bomService.updateBomItem(bomId, request);
    }

    @DeleteMapping("/bom/{bomId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBomItem(@PathVariable UUID bomId) {
        bomService.deleteBomItem(bomId);
    }
}
