package com.pcwms.backend.controller;

import com.pcwms.backend.dto.request.ApprovalRequest;
import com.pcwms.backend.dto.response.PaymentHistoryResponse;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.dto.response.SalesOrderDetailResponse;
import com.pcwms.backend.dto.response.SalesOrderListResponse;
import com.pcwms.backend.entity.SalesOrder;
import com.pcwms.backend.repository.PaymentRepository;
import com.pcwms.backend.repository.SalesOrderRepository;
import com.pcwms.backend.services.SalesOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/sales-orders")
@RequiredArgsConstructor
public class SalesOrderController {

    @Autowired
    private SalesOrderService salesOrderService;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private final PaymentRepository paymentRepository;

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
    @PostMapping("/from-quotation/{quotationId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES_MANAGER') or hasRole('SALES_STAFF')")
    public ResponseEntity<ResponseObject> createOrderFromQuotation(@PathVariable Long quotationId) {
        try {
            // Gọi hàm check tín dụng và đúc đơn hàng từ Service
            SalesOrder newOrder = salesOrderService.generateFromQuotation(quotationId);
            SalesOrderDetailResponse responseDto = new SalesOrderDetailResponse(newOrder);
            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Đã khởi tạo Đơn hàng " + newOrder.getOrderNumber() + " thành công!", responseDto)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }

    //API Director Approval
    @PutMapping("/{id}/approval")
    @PreAuthorize("hasRole('DIRECTOR') or hasRole('ADMIN')")
    public ResponseEntity<ResponseObject> approveOrRejectOrder(
            @PathVariable Long id,
            @RequestBody ApprovalRequest request
    ){
        try{
            Long directorId = 1L; // TODO: Lấy từ UserDetails (SecurityContext)
            SalesOrder updatedOrder = salesOrderService.processApproval(id, request, directorId);
            String msg = request.isApproved() ? "Đã PHÊ DUYỆT đơn hàng thành công!" : "Đã TỪ CHỐI đơn hàng!";
            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", msg, new SalesOrderDetailResponse(updatedOrder))
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }

    // API: LẤY LỊCH SỬ THANH TOÁN CỦA 1 ĐƠN HÀNG CỤ THỂ
    @GetMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR', 'SALES_MANAGER', 'SALES_STAFF')") // Thêm role Kế toán vào đây nếu có
    public ResponseEntity<ResponseObject> getOrderPaymentHistory(@PathVariable("id") Long orderId) {
        try {
            // 1. Kiểm tra xem đơn hàng có tồn tại không
            if (!salesOrderRepository.existsById(orderId)) {
                return ResponseEntity.badRequest().body(
                        new ResponseObject("ERROR", "Không tìm thấy Đơn hàng ID: " + orderId, null)
                );
            }

            // 2. Móc dữ liệu từ DB và Ép sang DTO
            List<PaymentHistoryResponse> paymentHistory = paymentRepository
                    .findBySalesOrderIdOrderByIdDesc(orderId)
                    .stream()
                    .map(PaymentHistoryResponse::new)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Lấy lịch sử thanh toán thành công!", paymentHistory)
            );
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    new ResponseObject("ERROR", "Lỗi hệ thống: " + e.getMessage(), null)
            );
        }
    }
}