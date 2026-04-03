package com.pcwms.backend.controller;

import com.pcwms.backend.dto.request.BomCalcRequest;
import com.pcwms.backend.dto.response.MaterialRequirementResponse;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.services.WorkOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("api/v1/work-orders")
@RequiredArgsConstructor
public class WorkOrderController {
    private final WorkOrderService workOrderService;

    //API Tinh BOM cho tao lenh san xuat(workorder)
    @PostMapping("/calculate-bom")
    @PreAuthorize("hasAnyRole('PRODUCTION_MANAGER', 'ADMIN', 'DIRECTOR')")
    public ResponseEntity<ResponseObject> calculateBom(@RequestBody BomCalcRequest request){
        try{
            if (request.getItems() == null || request.getItems().isEmpty()) {
                     throw new RuntimeException("Danh sách sản phẩm trống");
            }
            List<MaterialRequirementResponse> materialIsNeeded = workOrderService.calculateMaterialsNeeded(request);

            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Tính toán BOM thành công", materialIsNeeded)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", "Tính toán BOM thất bại: " + e.getMessage(), null)
            );
        }
    }
}
