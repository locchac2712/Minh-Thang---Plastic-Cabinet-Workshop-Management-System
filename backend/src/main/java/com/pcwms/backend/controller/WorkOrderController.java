package com.pcwms.backend.controller;

import com.pcwms.backend.dto.request.BomCalcRequest;
import com.pcwms.backend.dto.request.CreateWorkOrderRequest;
import com.pcwms.backend.dto.response.MaterialRequirementResponse;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.dto.response.WorkOrderInitResponse;
import com.pcwms.backend.entity.ManufactureOrder;
import com.pcwms.backend.entity.WorkOrder;
import com.pcwms.backend.repository.ManufactureOrderRepository;
import com.pcwms.backend.services.WorkOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/work-orders")
@RequiredArgsConstructor
public class WorkOrderController {
    private final WorkOrderService workOrderService;
    private final ManufactureOrderRepository manufactureOrderRepository;

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

    //API 1: Lấy thông tin kế hoạch để FE tự động điền
    @GetMapping("/init")
    @PreAuthorize("hasAnyRole('PRODUCTION_MANAGER', 'ADMIN', 'DIRECTOR')")
    public ResponseEntity<ResponseObject> initWorkOrderForm(@RequestParam Long planId) {
        try {
            ManufactureOrder plan = manufactureOrderRepository.findById(planId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Kế hoạch này!"));

            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Lấy dữ liệu Kế hoạch thành công", new WorkOrderInitResponse(plan))
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseObject("ERROR", e.getMessage(), null));
        }
    }

    // API 2: LƯU LỆNH GIAO VIỆC VÀO DATABASE
    // =================================================================
    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('PRODUCTION_MANAGER', 'ADMIN', 'DIRECTOR')")
    public ResponseEntity<ResponseObject> createWorkOrder(@RequestBody CreateWorkOrderRequest request) {
        try {
            if (request.getItems() == null || request.getItems().isEmpty()) {
                throw new RuntimeException("Lệnh sản xuất phải có ít nhất 1 sản phẩm!");
            }

            WorkOrder newWo = workOrderService.createWorkOrder(request);

            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Tuyệt vời! Đã phát hành Lệnh giao việc: " + newWo.getWoNumber(), newWo.getWoNumber())
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseObject("ERROR", e.getMessage(), null));
        }
    }
}
