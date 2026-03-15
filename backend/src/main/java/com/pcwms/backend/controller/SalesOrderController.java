package com.pcwms.backend.controller;

import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.dto.response.SalesOrderDetailResponse;
import com.pcwms.backend.dto.response.SalesOrderListResponse;
import com.pcwms.backend.services.SalesOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sales-orders")
public class SalesOrderController {

    @Autowired
    private SalesOrderService salesOrderService;

    // 👉 API: LẤY DANH SÁCH ĐƠN HÀNG
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES_MANAGER') or hasRole('SALES_STAFF') or hasRole('DIRECTOR')")
    public ResponseEntity<ResponseObject> getAllSalesOrders(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        try {
            Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
            Pageable pageable = PageRequest.of(page, size, sort);

            Page<SalesOrderListResponse> orders = salesOrderService.getAllSalesOrders(keyword, status, paymentStatus, pageable);

            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Lấy danh sách Đơn Hàng thành công!", orders)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }
    // 👉 API: Xem chi tiết 1 Đơn hàng
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES_MANAGER') or hasRole('SALES_STAFF') or hasRole('ACCOUNTANT')")
    public ResponseEntity<ResponseObject> getSalesOrderDetail(@PathVariable Long id) {
        try {
            // Nhớ import com.pcwms.backend.dto.response.SalesOrderDetailResponse;
            SalesOrderDetailResponse detail = salesOrderService.getSalesOrderDetail(id);
            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Lấy chi tiết Đơn hàng thành công!", detail)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }
}