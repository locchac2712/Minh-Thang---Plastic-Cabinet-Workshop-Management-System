package com.pcwms.backend.controller;

import com.pcwms.backend.dto.request.QuotationRequest;
import com.pcwms.backend.dto.response.QuotationListResponse;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.entity.Quotation;
import com.pcwms.backend.services.QuotationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import static org.springframework.http.ResponseEntity.ok;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/quotations")
public class QuotationController {

    @Autowired
    private QuotationService quotationService;

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES_MANAGER') or hasRole('DIRECTOR') or hasRole('SALES_STAFF')")
    public ResponseEntity<ResponseObject> createQuotation(@RequestBody QuotationRequest request) {
        try {
            Quotation savedQuotation = quotationService.createQuotation(request);
            return ok(
                    new ResponseObject("SUCCESS", "Tạo Báo giá thành công!", savedQuotation)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }

    // API SỬA STATUS
    @PostMapping("{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES_MANAGER') or hasRole('DIRECTOR') or hasRole('SALES_STAFF')")
    public ResponseEntity<ResponseObject> updateStatus(@PathVariable Long id, @RequestParam String status){
        try{
            Quotation updatedQuotation = quotationService.updateQuotationStatus(id, status);
            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Cập nhật trạng thái báo giá thành công!", updatedQuotation)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }
    // API SỬA NỘI DUNG (Thêm/bớt Bàn Ghế, sửa chiết khấu)
    // ========================================================
    @PutMapping("/{id}/update")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES_MANAGER') or hasRole('SALES_STAFF')")
    public ResponseEntity<ResponseObject> updateQuotation(
            @PathVariable Long id,
            @RequestBody QuotationRequest request) {
        try {
            // Gọi hàm updateQuotation (sửa ruột)
            Quotation updatedQuotation = quotationService.updateQuotation(id, request);
            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Cập nhật nội dung Báo giá thành công!", updatedQuotation)
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

            Page<QuotationListResponse> quotations = quotationService.getAllQuotations(keyword, status, pageable);

            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Lấy danh sách Báo giá thành công!", quotations)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }
}