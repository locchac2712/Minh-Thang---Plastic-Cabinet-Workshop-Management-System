package com.pcwms.backend.controller;

import com.pcwms.backend.dto.request.QuotationRequest;
import com.pcwms.backend.dto.response.QuotationDetailResponse;
import com.pcwms.backend.dto.response.QuotationListResponse;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.entity.Quotation;
import com.pcwms.backend.services.QuotationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import static org.springframework.http.ResponseEntity.ok;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/quotations")
public class QuotationController {

    @Autowired
    private QuotationService quotationService;

    // Sửa createQuotation endpoint
    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES_MANAGER') or hasRole('DIRECTOR') or hasRole('SALES_STAFF')")
    public ResponseEntity<ResponseObject> createQuotation(@RequestBody QuotationRequest request) {
        try {
            Quotation savedQuotation = quotationService.createQuotation(request);
            // ✅ Wrap bằng DTO thay vì trả thẳng entity
            return ok(new ResponseObject("SUCCESS", "Tạo Báo giá thành công!",
                    new QuotationDetailResponse(savedQuotation)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null));
        }
    }

    // Sửa updateQuotation endpoint
    @PutMapping("/{id}/update")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES_MANAGER') or hasRole('SALES_STAFF')")
    public ResponseEntity<ResponseObject> updateQuotation(
            @PathVariable Long id,
            @RequestBody QuotationRequest request) {
        try {
            Quotation updatedQuotation = quotationService.updateQuotation(id, request);
            // ✅ Wrap bằng DTO
            return ResponseEntity.ok(new ResponseObject("SUCCESS", "Cập nhật nội dung Báo giá thành công!",
                    new QuotationDetailResponse(updatedQuotation)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null));
        }
    }

    // Sửa updateStatus endpoint
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_MANAGER', 'DIRECTOR', 'SALES_STAFF')")
    public ResponseEntity<ResponseObject> updateQuotationStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String note){
        try {
            String newStatus = status.toUpperCase();

            // 👉 1. LẤY THÔNG TIN NGƯỜI ĐANG BẤM NÚT TỪ TOKEN
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            // 👉 2. BỨC TƯỜNG LỬA CHẶN ROLE
            // Nếu hành động là DUYỆT (APPROVED) hoặc TỪ CHỐI (REJECTED)
            if (newStatus.equals("APPROVED") || newStatus.equals("REJECTED")) {

                // Soi xem trong list Role của user này có ROLE_DIRECTOR hoặc ROLE_ADMIN không
                boolean isDirector = authentication.getAuthorities().stream()
                        .anyMatch(role -> role.getAuthority().equals("ROLE_DIRECTOR") || role.getAuthority().equals("ROLE_ADMIN"));

                // Nếu không phải Giám đốc -> Đá văng ra ngoài ngay lập tức (Lỗi 403)
                if (!isDirector) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                            new ResponseObject("ERROR", "Access Denied: Vượt quyền! Chỉ Giám đốc (DIRECTOR) mới có quyền Duyệt hoặc Từ chối Báo giá.", null)
                    );
                }
            }

            // 👉 3. Nếu Pass qua bức tường lửa, gọi Service chạy Máy trạng thái (State Machine)
            Quotation updatedQuotation = quotationService.updateQuotationStatus(id, newStatus, note);

            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Cập nhật trạng thái thành công!", updatedQuotation)
            );

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES_MANAGER') or hasRole('DIRECTOR') or hasRole('SALES_STAFF')")
    public ResponseEntity<ResponseObject> getAllQuotation(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir){
        try {
            // Setup phân trang và sắp xếp (Mặc định: Mới nhất nổi lên đầu)
            org.springframework.data.domain.Sort sort = sortDir.equalsIgnoreCase("asc") ?
                    org.springframework.data.domain.Sort.by(sortBy).ascending() :
                    org.springframework.data.domain.Sort.by(sortBy).descending();

            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, sort);

            Page<QuotationListResponse> quotations = quotationService.getAllQuotations(keyword, status, customerId, pageable);

            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Lấy danh sách Báo giá thành công!", quotations)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }
    // 👉 API Xem chi tiết 1 Báo giá
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES_MANAGER') or hasRole('SALES_STAFF')")
    public ResponseEntity<ResponseObject> getQuotationDetail(@PathVariable Long id) {
        try {
            QuotationDetailResponse detail = quotationService.getQuotationDetail(id);
            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Lấy chi tiết Báo giá thành công!", detail)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }
}