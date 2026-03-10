package com.pcwms.backend.controller;

import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.entity.Material;
import com.pcwms.backend.services.MaterialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/materials")
public class MaterialController {

    @Autowired
    private MaterialService materialService;

    // 1. Lấy danh sách (Nâng cấp: Trả về DTO có chứa trạng thái isLowStock)
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseObject> getAllMaterials() {
        return ResponseEntity.ok(
                // Đổi thành gọi hàm DTO thay vì hàm Entity
                new ResponseObject("SUCCESS", "Lấy danh sách thành công", materialService.getAllMaterialsWithAlert())
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseObject> getMaterialById(@PathVariable Long id) {
        return ResponseEntity.ok(
                new ResponseObject(
                        "SUCCESS",
                        "Lấy chi tiết thành công",
                        materialService.getMaterialDetail(id) // 👉 ĐỔI TÊN HÀM Ở ĐÚNG CHỖ NÀY!
                )
        );
    }

    // 2. Tạo mới: Chặn Admin/Director/WarehouseManager
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('WAREHOUSE_MANAGER')") // Production Manager cũng có thể tạo mới vật tư
    public ResponseEntity<ResponseObject> createMaterial(@RequestBody Material material) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Khởi tạo vật tư thành công", materialService.createMaterial(material))
        );
    }

    // 3. Cập nhật thông tin (Bao gồm cả ngưỡng an toàn minStockLevel)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('WAREHOUSE_MANAGER') or hasRole('PRODUCTION_MANAGER')")
    public ResponseEntity<ResponseObject> updateMaterial(@PathVariable Long id, @RequestBody Material material) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Cập nhật vật tư thành công", materialService.updateMaterial(id, material))
        );
    }

    // 4. API Đặc biệt: Cập nhật nhanh ngưỡng tồn kho tối thiểu (Dành cho Quản lý sản xuất)
    @PatchMapping("/{id}/min-stock")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR') or hasRole('WAREHOUSE_MANAGER')")
    public ResponseEntity<ResponseObject> updateMinStock(@PathVariable Long id, @RequestParam Integer minLevel) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Đã thiết lập ngưỡng an toàn mới", materialService.updateMinStock(id, minLevel))
        );
    }

    // 5. Xóa mềm: Thay vì xóa hẳn, ta nên ẩn nó đi để tránh mất lịch sử phiếu kho
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<ResponseObject> deleteMaterial(@PathVariable Long id) {
        materialService.deleteMaterial(id); // Trong Service hãy đổi active = false
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Đã xóa vật tư khỏi danh sách hoạt động", null)
        );
    }
}