package com.pcwms.backend.controller;

import com.pcwms.backend.dto.request.WarehouseTransactionRequest;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.security.services.UserDetailsImpl;
import com.pcwms.backend.services.WarehouseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/warehouse")
public class WarehouseController {

    @Autowired
    private WarehouseService warehouseService;

    @Autowired
    private com.pcwms.backend.repository.WarehouseTransactionRepository transactionRepository;

    @GetMapping("/transactions")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER') or hasRole('PRODUCTION_MANAGER')")
    public ResponseEntity<ResponseObject> getTransactions(@RequestParam(required = false) String type) {
        java.util.List<com.pcwms.backend.entity.WarehouseTransaction> list;
        if (type != null && !type.isEmpty()) {
            list = transactionRepository.findAllByTypeOrderByIdDesc(com.pcwms.backend.entity.TransactionType.valueOf(type));
        } else {
            list = transactionRepository.findAll();
        }

        java.util.List<com.pcwms.backend.dto.response.WarehouseTransactionResponse> dtos = list.stream().map(tx -> {
            java.util.List<com.pcwms.backend.dto.response.TransactionDetailResponse> detailResponses = tx.getDetails().stream().map(detail -> {
                String itemName = detail.getProduct() != null ? detail.getProduct().getName() :
                        (detail.getMaterial() != null ? detail.getMaterial().getName() : "");
                String itemType = detail.getProduct() != null ? "PRODUCT" : "MATERIAL";
                return new com.pcwms.backend.dto.response.TransactionDetailResponse(detail.getId(), itemName, itemType, detail.getQuantity());
            }).collect(java.util.stream.Collectors.toList());

            return new com.pcwms.backend.dto.response.WarehouseTransactionResponse(
                    tx.getId(),
                    tx.getType().name(),
                    tx.getReferenceId(),
                    tx.getDate(),
                    tx.getStaff() != null ? tx.getStaff().getFullname() : "N/A",
                    tx.getWarehouse() != null ? tx.getWarehouse().getName() : "Kho chính",
                    detailResponses
            );
        }).collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(new ResponseObject("SUCCESS", "Lấy danh sách thành công", dtos));
    }

    @PostMapping("/import")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER')")
    public ResponseEntity<ResponseObject> importMaterials(@RequestBody WarehouseTransactionRequest request) {

        // Bóc ID của User từ Token đã xác thực
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long currentUserId = userDetails.getId();
        if (currentUserId == null) {
            throw new RuntimeException("BẮT ĐƯỢC LỖI: Lấy Token thành công nhưng currentUserId bị null!");
        }

        return ResponseEntity.ok(
                new ResponseObject(
                        "SUCCESS",
                        "Tạo phiếu nhập kho thành công!",
                        warehouseService.importMaterials(request, currentUserId)
                )
        );
    }

    @PostMapping("/export")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER') or hasRole('PRODUCTION_MANAGER')")
    public ResponseEntity <ResponseObject> exportMaterials(@RequestBody WarehouseTransactionRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long currentUserId = userDetails.getId();

        return ResponseEntity.ok(
                new ResponseObject(
                        "SUCCESS",
                        "Tạo phiếu xuất kho thành công!",
                        warehouseService.exportMaterials(request, currentUserId)
                )
        );
    }

    @PostMapping("/adjustment")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE_MANAGER')")
    public ResponseEntity <ResponseObject> adjustMaterials(@RequestBody WarehouseTransactionRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long currentUserId = userDetails.getId();

        return ResponseEntity.ok(
                new ResponseObject(
                        "SUCCESS",
                        "Điều chỉnh số lượng kho thành công!",
                        warehouseService.adjustMaterials(request, currentUserId)
                )
        );
    }
}