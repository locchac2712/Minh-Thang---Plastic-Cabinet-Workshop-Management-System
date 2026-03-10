package com.pcwms.backend.controller;

import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.entity.Warehouse;
import com.pcwms.backend.repository.WarehouseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/warehouses")
public class WarehouseRestController {

    @Autowired
    private WarehouseRepository warehouseRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseObject> getAllWarehouses(@RequestParam(required = false) String q) {
        List<Warehouse> list;
        if (q != null && !q.trim().isEmpty()) {
            list = warehouseRepository.findByNameContainingIgnoreCaseOrCodeContainingIgnoreCase(q, q);
        } else {
            list = warehouseRepository.findAll();
        }
        return ResponseEntity.ok(new ResponseObject("SUCCESS", "Lấy danh sách kho thành công", list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseObject> getWarehouseById(@PathVariable Long id) {
        return warehouseRepository.findById(id)
                .map(w -> ResponseEntity.ok(new ResponseObject("SUCCESS", "Lấy kho thành công", w)))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kho"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER')")
    public ResponseEntity<ResponseObject> createWarehouse(@RequestBody Warehouse warehouse) {
        if (warehouse.getActive() == null) warehouse.setActive(true);
        Warehouse saved = warehouseRepository.save(warehouse);
        return ResponseEntity.ok(new ResponseObject("SUCCESS", "Thêm kho thành công", saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER')")
    public ResponseEntity<ResponseObject> updateWarehouse(@PathVariable Long id, @RequestBody Warehouse dto) {
        Warehouse w = warehouseRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy kho"));
        w.setName(dto.getName());
        w.setCode(dto.getCode());
        w.setLocation(dto.getLocation());
        w.setAddress(dto.getAddress());
        if (dto.getActive() != null) w.setActive(dto.getActive());
        
        Warehouse saved = warehouseRepository.save(w);
        return ResponseEntity.ok(new ResponseObject("SUCCESS", "Cập nhật kho thành công", saved));
    }

    @PutMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER')")
    public ResponseEntity<ResponseObject> toggleWarehouse(@PathVariable Long id) {
        Warehouse w = warehouseRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy kho"));
        w.setActive(w.getActive() != null ? !w.getActive() : false);
        Warehouse saved = warehouseRepository.save(w);
        return ResponseEntity.ok(new ResponseObject("SUCCESS", "Đổi trạng thái thành công", saved));
    }
}
