package com.pcwms.backend.controller;

import com.pcwms.backend.dto.request.CreateMORequest;
import com.pcwms.backend.dto.response.MOCalendarResponse;
import com.pcwms.backend.dto.response.MODetailResponse;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.entity.ManufactureOrder;
import com.pcwms.backend.repository.ManufactureOrderRepository;
import com.pcwms.backend.services.ManufactureOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/manufacture-orders")
@RequiredArgsConstructor
public class ManufactureOrderController {
    private final ManufactureOrderRepository manufactureOrderRepository;
    private final ManufactureOrderService manufactureOrderService;

    //API lấy dữ liệu vẽ calendar lịch sản xuất
    @GetMapping("/calendar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseObject> getProductionCalendar(){
        try{
            List<MOCalendarResponse> calendarData = manufactureOrderRepository.findAllForCalendar()
                    .stream()
                    .map(MOCalendarResponse::new)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Lấy dữ liệu lịch sản xuất thành công", calendarData)
            );
        }catch (Exception e){
            return ResponseEntity.internalServerError().body(
                    new ResponseObject("ERROR", "Lỗi hệ thống: " + e.getMessage(), null)
            );
        }
    }

    // API: QUẢN ĐỐC TẠO LỆNH SẢN XUẤT MỚI (CHẠY THUẬT TOÁN ĐẾM LÙI)
    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('PRODUCTION_MANAGER', 'ADMIN', 'DIRECTOR')")
    public ResponseEntity<ResponseObject> createManufactureOrder(
            @RequestBody CreateMORequest request) {
        try {
            // Gọi "Trái tim thuật toán" để tính toán và đúc Lệnh
            ManufactureOrder newMO = manufactureOrderService.createManufactureOrder(
                    request.getSalesOrderId(),
                    request.getProductId(),
                    request.getQuantity(),
                    request.getTechnicalNotes(),
                    request.getRequestedStartDate()
            );

            // Ép sang DTO cho sạch sẽ
            MODetailResponse responseData = new MODetailResponse(newMO);

            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Tuyệt vời! Đã lên lịch sản xuất thành công Lệnh: " + newMO.getMoNumber(), responseData)
            );
        } catch (Exception e) {
            // Bắt trọn các lỗi như: Chưa có DueDate, Xưởng quá tải bị lùi về quá khứ...
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }

    // API: XẾP LỊCH SẢN XUẤT THỦ CÔNG (TỰ QUYẾT ĐỊNH NGÀY BẮT ĐẦU VÀ KẾT THÚC)
    @PostMapping("/manual-schedule")
    @PreAuthorize("hasAnyRole('PRODUCTION_MANAGER', 'ADMIN', 'DIRECTOR')")
    public ResponseEntity<ResponseObject> manualScheduleManufactureOrder(
            @RequestBody CreateMORequest request) {
        try {
            ManufactureOrder newMO = manufactureOrderService.createManualManufactureOrder(
                    request.getSalesOrderId(),
                    request.getProductId(),
                    request.getQuantity(),
                    request.getTechnicalNotes(),
                    request.getRequestedStartDate(),
                    request.getRequestedEndDate()
            );

            MODetailResponse responseData = new MODetailResponse(newMO);
            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Lên lịch thủ công thành công Lệnh: " + newMO.getMoNumber(), responseData)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }
}
