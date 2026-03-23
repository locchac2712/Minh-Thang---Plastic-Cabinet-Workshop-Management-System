package com.pcwms.backend.controller;

import com.pcwms.backend.dto.request.SendApprovalRequest;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.entity.SalesOrder;
import com.pcwms.backend.repository.SalesOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/sales-orders")
@RequiredArgsConstructor
public class ApprovalRequestController {

    private final SalesOrderRepository salesOrderRepository;

    /**
     * POST /api/v1/sales-orders/{id}/request-approval
     * Sales staff ghi note + hạn mức đề xuất vào đơn
     * Director vào hệ thống thấy đơn PENDING_APPROVAL → duyệt trực tiếp
     */
    @PostMapping("/{id}/request-approval")
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ResponseObject> requestApproval(
            @PathVariable Long id,
            @RequestBody SendApprovalRequest request) {
        try {
            SalesOrder order = salesOrderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + id));

            if (!"PENDING_APPROVAL".equals(order.getStatus())) {
                throw new RuntimeException("Chỉ đơn PENDING_APPROVAL mới có thể gửi yêu cầu!");
            }

            // Lưu note + hạn mức đề xuất để Director đọc khi duyệt
            order.setApprovalNote(buildNote(request));
            salesOrderRepository.save(order);

            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Đã gửi yêu cầu phê duyệt thành công!", null)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }

    private String buildNote(SendApprovalRequest request) {
        StringBuilder sb = new StringBuilder();
        if (request.getProposedCreditLimit() != null
                && request.getProposedCreditLimit().compareTo(BigDecimal.ZERO) > 0) {
            String fmtLimit = NumberFormat.getNumberInstance(new Locale("vi", "VN"))
                    .format(request.getProposedCreditLimit()).replace(",", ".");
            sb.append("[Han muc de xuat: ").append(fmtLimit).append(" VND] ");
        }
        if (request.getNote() != null && !request.getNote().isBlank()) {
            sb.append(request.getNote());
        }
        return sb.toString();
    }
}