package com.pcwms.backend.controller;

import com.pcwms.backend.dto.request.WarehouseTransactionRequest;
import com.pcwms.backend.services.WarehouseTransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/warehouse")
public class WarehouseTransactionController {

    @Autowired
    private WarehouseTransactionService transactionService;

    // API Lấy danh sách phiếu XUẤT KHO
    @GetMapping("/exports")
    public ResponseEntity<?> getExportTransactions(
            @RequestParam(defaultValue = "0") int page,      // Mặc định load trang 0
            @RequestParam(defaultValue = "10") int size,     // Mặc định 10 dòng/trang
            @RequestParam(required = false) String keyword   // Từ khóa tìm kiếm (có thể rỗng)
    ) {
        try {
            return ResponseEntity.ok(transactionService.getExportTransactionsWithPagination(keyword, page, size));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi khi lấy danh sách xuất kho: " + e.getMessage());
        }
    }

    // API TẠO PHIẾU XUẤT/NHẬP KHO MỚI
    @PostMapping("/transaction")
    public ResponseEntity<?> createTransaction(@RequestBody WarehouseTransactionRequest request) {
        try {
            // 1. Cứ gọi Service cho nó chạy logic tạo phiếu và cộng/trừ tồn kho ngầm
            transactionService.createTransaction(request);

            // 2. Nếu chạy qua dòng trên mà không bị lỗi (không bị văng Exception do hết hàng)
            // thì trả thẳng về cho Postman câu báo hỉ luôn!
            return ResponseEntity.ok("Tạo phiếu thành công tuyệt đối!");

        } catch (Exception e) {
            // Bắt lỗi nếu kho không đủ hàng và ném ra 400 Bad Request
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}