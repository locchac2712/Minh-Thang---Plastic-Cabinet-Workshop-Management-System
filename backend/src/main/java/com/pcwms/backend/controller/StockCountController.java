package com.pcwms.backend.controller;

import com.pcwms.backend.dto.request.StockCountRequest;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.dto.response.StockCountResponse;
import com.pcwms.backend.dto.response.StockCountDetailResponse;
import com.pcwms.backend.entity.StockCount;
import com.pcwms.backend.entity.StockCountDetail;
import com.pcwms.backend.entity.Warehouse;
import com.pcwms.backend.entity.Staff;
import com.pcwms.backend.entity.Material;
import com.pcwms.backend.entity.WarehouseTransaction;
import com.pcwms.backend.entity.TransactionType;
import com.pcwms.backend.entity.TransactionDetail;
import com.pcwms.backend.repository.StockCountRepository;
import com.pcwms.backend.repository.WarehouseRepository;
import com.pcwms.backend.repository.StaffRepository;
import com.pcwms.backend.repository.MaterialRepository;
import com.pcwms.backend.repository.WarehouseTransactionRepository;
import com.pcwms.backend.security.services.UserDetailsImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/stock-counts")
public class StockCountController {

    @Autowired
    private StockCountRepository stockCountRepository;
    @Autowired
    private WarehouseRepository warehouseRepository;
    @Autowired
    private StaffRepository staffRepository;
    @Autowired
    private MaterialRepository materialRepository;
    @Autowired
    private WarehouseTransactionRepository transactionRepository;

    private Long getCurrentUserId() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userDetails.getId();
    }

    private StockCountResponse mapToDto(StockCount c) {
        List<StockCountDetailResponse> itemDtos = new ArrayList<>();
        if (c.getDetails() != null) {
            itemDtos = c.getDetails().stream().map(d -> {
                return new StockCountDetailResponse(
                        d.getId(),
                        d.getMaterial() != null ? d.getMaterial().getId() : null,
                        d.getMaterial() != null ? d.getMaterial().getName() : "",
                        d.getMaterial() != null ? d.getMaterial().getSku() : "",
                        d.getSystemQuantity(),
                        d.getActualQuantity(),
                        d.getDifference(),
                        d.getNotes()
                );
            }).collect(Collectors.toList());
        }

        return new StockCountResponse(
                c.getId(),
                c.getCountNumber(),
                c.getWarehouse() != null ? new StockCountResponse.WarehouseResponse(c.getWarehouse().getId(), c.getWarehouse().getName()) : null,
                c.getCountDate(),
                c.getStatus(),
                c.getNotes(),
                c.getStaff() != null ? c.getStaff().getFullname() : "",
                c.getCreatedAt(),
                itemDtos
        );
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER')")
    public ResponseEntity<ResponseObject> getAll() {
        List<StockCount> list = stockCountRepository.findAll();
        List<StockCountResponse> dtos = list.stream().map(this::mapToDto).collect(Collectors.toList());
        return ResponseEntity.ok(new ResponseObject("SUCCESS", "Lấy danh sách thành công", dtos));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER')")
    public ResponseEntity<ResponseObject> getById(@PathVariable Long id) {
        StockCount c = stockCountRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu kiểm kê"));
        return ResponseEntity.ok(new ResponseObject("SUCCESS", "Chi tiết", mapToDto(c)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER')")
    @Transactional
    public ResponseEntity<ResponseObject> create(@RequestBody StockCountRequest request) {
        Staff staff = staffRepository.findByUserId(getCurrentUserId())
                .orElseThrow(() -> new RuntimeException("Tài khoản chưa liên kết nhân viên"));
        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Kho không tồn tại"));

        StockCount stockCount = new StockCount();
        stockCount.setWarehouse(warehouse);
        stockCount.setCountDate(request.getCountDate() != null ? request.getCountDate() : LocalDateTime.now().toLocalDate());
        stockCount.setStatus("DRAFT");
        stockCount.setNotes(request.getNotes());
        stockCount.setStaff(staff);
        stockCount.setCreatedAt(LocalDateTime.now());
        stockCount = stockCountRepository.save(stockCount);
        stockCount.setCountNumber("KK-" + String.format("%04d", stockCount.getId()));

        if (request.getItems() != null) {
            List<StockCountDetail> details = new ArrayList<>();
            for (var itemReq : request.getItems()) {
                StockCountDetail detail = new StockCountDetail();
                detail.setStockCount(stockCount);
                if (itemReq.getMaterialId() != null) {
                    Material m = materialRepository.findById(itemReq.getMaterialId()).orElse(null);
                    detail.setMaterial(m);
                }
                detail.setSystemQuantity(itemReq.getSystemQuantity() != null ? itemReq.getSystemQuantity() : 0);
                detail.setActualQuantity(itemReq.getActualQuantity() != null ? itemReq.getActualQuantity() : 0);
                detail.setDifference(detail.getActualQuantity() - detail.getSystemQuantity());
                detail.setNotes(itemReq.getNotes());
                details.add(detail);
            }
            stockCount.setDetails(details);
        }

        stockCount = stockCountRepository.save(stockCount);
        return ResponseEntity.ok(new ResponseObject("SUCCESS", "Đã lưu phiếu kiểm kê nháp", mapToDto(stockCount)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER')")
    @Transactional
    public ResponseEntity<ResponseObject> update(@PathVariable Long id, @RequestBody StockCountRequest request) {
        StockCount stockCount = stockCountRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy"));
        if (!"DRAFT".equals(stockCount.getStatus())) {
            throw new RuntimeException("Chỉ được lưu phiếu nháp");
        }

        if (request.getNotes() != null) stockCount.setNotes(request.getNotes());
        
        if (request.getItems() != null) {
            stockCount.getDetails().clear();
            for (var itemReq : request.getItems()) {
                StockCountDetail detail = new StockCountDetail();
                detail.setStockCount(stockCount);
                if (itemReq.getMaterialId() != null) {
                    Material m = materialRepository.findById(itemReq.getMaterialId()).orElse(null);
                    detail.setMaterial(m);
                }
                detail.setSystemQuantity(itemReq.getSystemQuantity() != null ? itemReq.getSystemQuantity() : 0);
                detail.setActualQuantity(itemReq.getActualQuantity() != null ? itemReq.getActualQuantity() : 0);
                detail.setDifference(detail.getActualQuantity() - detail.getSystemQuantity());
                detail.setNotes(itemReq.getNotes());
                stockCount.getDetails().add(detail);
            }
        }
        stockCount = stockCountRepository.save(stockCount);
        return ResponseEntity.ok(new ResponseObject("SUCCESS", "Đã cập nhật phiếu kiểm kê nháp", mapToDto(stockCount)));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER')")
    @Transactional
    public ResponseEntity<ResponseObject> complete(@PathVariable Long id) {
        StockCount stockCount = stockCountRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy"));
        if (!"DRAFT".equals(stockCount.getStatus())) {
            throw new RuntimeException("Chỉ được hoàn thành phiếu nháp");
        }

        Staff staff = staffRepository.findByUserId(getCurrentUserId()).orElseThrow();

        // Tao phieu dieu chinh cho cac mat hang co chenh lech
        WarehouseTransaction transaction = new WarehouseTransaction();
        transaction.setType(TransactionType.ADJUSTMENT);
        transaction.setDate(LocalDateTime.now());
        transaction.setStaff(staff);
        transaction.setWarehouse(stockCount.getWarehouse());
        transaction.setReferenceId(stockCount.getCountNumber());
        List<TransactionDetail> adjDetails = new ArrayList<>();

        for (StockCountDetail d : stockCount.getDetails()) {
            if (d.getDifference() != 0 && d.getMaterial() != null) {
                Material m = d.getMaterial();
                int current = m.getCurrentStock() != null ? m.getCurrentStock() : 0;
                // Update system stock
                m.setCurrentStock(current + d.getDifference());
                materialRepository.save(m);

                TransactionDetail adj = new TransactionDetail();
                adj.setWarehouseTransaction(transaction);
                adj.setMaterial(m);
                adj.setQuantity(d.getDifference());
                adjDetails.add(adj);
            }
        }

        if (!adjDetails.isEmpty()) {
            transaction.setDetails(adjDetails);
            transactionRepository.save(transaction);
        }

        stockCount.setStatus("COMPLETED");
        stockCountRepository.save(stockCount);

        return ResponseEntity.ok(new ResponseObject("SUCCESS", "Đã hoàn thành kiểm kê", mapToDto(stockCount)));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER')")
    @Transactional
    public ResponseEntity<ResponseObject> cancel(@PathVariable Long id) {
        StockCount stockCount = stockCountRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy"));
        if (!"DRAFT".equals(stockCount.getStatus())) {
            throw new RuntimeException("Chỉ được huỷ phiếu nháp");
        }
        stockCount.setStatus("CANCELLED");
        stockCountRepository.save(stockCount);
        return ResponseEntity.ok(new ResponseObject("SUCCESS", "Đã huỷ kiểm kê", mapToDto(stockCount)));
    }
}
