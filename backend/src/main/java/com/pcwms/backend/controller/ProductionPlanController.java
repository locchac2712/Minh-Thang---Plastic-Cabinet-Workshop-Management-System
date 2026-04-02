package com.pcwms.backend.controller;

import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.entity.ProductionPlan;
import com.pcwms.backend.services.ProductionPlanService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/production-plans")
@RequiredArgsConstructor
public class ProductionPlanController {

    private final ProductionPlanService productionPlanService;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    public ResponseEntity<ResponseObject> generatePlan(
            @RequestParam Long salesOrderId,
            @RequestBody PlanDatesRequest request
    ) {
        try {
            ProductionPlan plan = productionPlanService.createPlanFromSalesOrder(
                    salesOrderId,
                    request.getStartDate(),
                    request.getEndDate()
            );
            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Đã lập kế hoạch sản xuất thành công!", plan)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER', 'DIRECTOR')")
    public ResponseEntity<ResponseObject> getAllPlans() {
        try {
            List<ProductionPlan> plans = productionPlanService.getAllPlans();
            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Lấy danh sách kế hoạch thành công!", plans)
            );
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }

    @PatchMapping("/work-orders/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    public ResponseEntity<ResponseObject> updateWorkOrderStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        try {
            productionPlanService.updateManufactureOrderStatus(id, status);
            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Đã cập nhật trạng thái lệnh sản xuất!", null)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }

    @Data
    public static class PlanDatesRequest {
        private LocalDate startDate;
        private LocalDate endDate;
    }
}
