package com.pcwms.backend.services;

import com.pcwms.backend.entity.ManufactureOrder;
import com.pcwms.backend.entity.Product;
import com.pcwms.backend.entity.SalesOrder;
import com.pcwms.backend.repository.ManufactureOrderRepository;
import com.pcwms.backend.repository.ProductRepository;
import com.pcwms.backend.repository.SalesOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ManufactureOrderService {

    private final ManufactureOrderRepository manufactureOrderRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final ProductRepository productRepository;


    // THUẬT TOÁN ĐÚC LỆNH SẢN XUẤT (FORWARD SCHEDULING & VALIDATION)
    @Transactional
    public ManufactureOrder createManufactureOrder(Long salesOrderId, Long productId, Integer quantity, String technicalNotes, LocalDateTime requestedStartDate) {

        SalesOrder salesOrder = salesOrderRepository.findById(salesOrderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Đơn hàng: " + salesOrderId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Sản phẩm: " + productId));

        if (salesOrder.getDueDate() == null) {
            throw new RuntimeException("Đơn hàng chưa có Ngày giao (Due Date). Không thể lên lịch!");
        }

        if (requestedStartDate == null) {
            throw new RuntimeException("Quản đốc phải chọn Ngày bắt đầu dự kiến!");
        }

        if (product.getEstimatedProductionHours() == null) {
            throw new RuntimeException(String.format(
                    "Sản phẩm [%s] chưa được cài đặt 'Thời gian sản xuất dự kiến'. Vui lòng cập nhật thông tin sản phẩm trước!",
                    product.getName()
            ));
        }

        // 1. TÍNH TỔNG SỐ CA LÀM VIỆC CẦN THIẾT
        double totalHours = quantity * product.getEstimatedProductionHours();
        int shiftsNeeded = (int) Math.ceil(totalHours / 4.0);

        List<ManufactureOrder> existingMOs = manufactureOrderRepository.findAllForCalendar();

        // 2. THIẾT LẬP ĐIỂM XUẤT PHÁT (Ngày Quản đốc chọn)
        LocalDateTime currentDay = requestedStartDate;
        // Tự động gán ca dựa vào giờ pick: Chọn trước 12h trưa -> Ca sáng (1). Chọn sau 12h -> Ca chiều (2).
        int currentShift = requestedStartDate.getHour() < 12 ? 1 : 2;

        LocalDateTime finalEndDate = null;

        // 3. VÒNG LẶP CHẠY TIẾN VỀ TƯƠNG LAI ĐỂ TÌM NGÀY KẾT THÚC
        while (shiftsNeeded > 0) {
            // RULE A: NÉ CHỦ NHẬT (Tiến lên thứ 2)
            if (currentDay.getDayOfWeek() == DayOfWeek.SUNDAY) {
                currentDay = currentDay.plusDays(1); // Sang thứ 2
                currentShift = 1; // Bắt đầu từ ca sáng thứ 2
                continue;
            }

            // Setup khung giờ của Ca hiện tại
            LocalDateTime shiftStart = (currentShift == 1)
                    ? LocalDateTime.of(currentDay.toLocalDate(), LocalTime.of(8, 0))
                    : LocalDateTime.of(currentDay.toLocalDate(), LocalTime.of(13, 0));
            LocalDateTime shiftEnd = (currentShift == 1)
                    ? LocalDateTime.of(currentDay.toLocalDate(), LocalTime.of(12, 0))
                    : LocalDateTime.of(currentDay.toLocalDate(), LocalTime.of(17, 0));

            // 👉 KIỂM DUYỆT 1: NẾU BỊ TRÙNG LỊCH XƯỞNG -> VĂNG LỖI NGAY LẬP TỨC
            if (isOverlapping(shiftStart, shiftEnd, existingMOs)) {
                throw new RuntimeException(String.format(
                        "THẤT BẠI: Nếu bắt đầu vào %s, đến khoảng %s xưởng sẽ bị trùng lịch với một Lệnh khác đang chạy! Vui lòng chọn ngày khác.",
                        requestedStartDate.toLocalDate(), shiftStart
                ));
            }

            finalEndDate = shiftEnd; // Liên tục cập nhật ngày kết thúc
            shiftsNeeded--;

            // Tiến lên 1 ca để chạy vòng lặp tiếp
            if (currentShift == 1) {
                currentShift = 2; // Sang ca chiều
            } else {
                currentShift = 1; // Sang ca sáng hôm sau
                currentDay = currentDay.plusDays(1);
            }
        }

        // 👉 KIỂM DUYỆT 2: CÓ KỊP DEADLINE KHÔNG? (Target = DueDate - 2 ngày)
        LocalDate targetEndDate = salesOrder.getDueDate().minusDays(2);
        if (finalEndDate.toLocalDate().isAfter(targetEndDate)) {
            throw new RuntimeException(String.format(
                    "CẢNH BÁO TRỄ HẠN: Nếu bắt đầu vào %s, hệ thống tính toán đến tận %s mới làm xong. Hạn chót bắt buộc của xưởng là %s. Không thể chốt kế hoạch này!",
                    requestedStartDate.toLocalDate(), finalEndDate.toLocalDate(), targetEndDate
            ));
        }

        // 4. MỌI ĐIỀU KIỆN ĐỀU PASS -> CHỐT LỆNH SẢN XUẤT!
        ManufactureOrder mo = new ManufactureOrder();
        mo.setMoNumber("MO-" + System.currentTimeMillis());
        mo.setSalesOrder(salesOrder);
        mo.setProduct(product);
        mo.setQuantity(quantity);
        mo.setStatus("PLANNED");
        mo.setStartDate(requestedStartDate);
        mo.setEndDate(finalEndDate); // Do hệ thống tự tính ra
        mo.setTechnicalNotes(technicalNotes);

        manufactureOrderRepository.save(mo);
        log.info("Đã chốt thành công MO: {} | Từ {} đến {}", mo.getMoNumber(), mo.getStartDate(), mo.getEndDate());

        return mo;
    }

    // TẠO LỆNH SẢN XUẤT THỦ CÔNG (MANUAL SCHEDULING - BỎ QUA KIỂM DUYỆT THUẬT TOÁN)
    @Transactional
    public ManufactureOrder createManualManufactureOrder(Long salesOrderId, Long productId, Integer quantity, String technicalNotes, LocalDateTime startDate, LocalDateTime endDate) {
        SalesOrder salesOrder = salesOrderRepository.findById(salesOrderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Đơn hàng: " + salesOrderId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Sản phẩm: " + productId));

        if (startDate == null || endDate == null) {
            throw new RuntimeException("Bạn phải chọn cấu trúc Ngày bắt đầu và Ngày kết thúc!");
        }

        if (startDate.isAfter(endDate)) {
            throw new RuntimeException("Ngày bắt đầu không thể diễn ra sau ngày kết thúc!");
        }

        ManufactureOrder mo = new ManufactureOrder();
        mo.setMoNumber("MO-MANUAL-" + System.currentTimeMillis());
        mo.setSalesOrder(salesOrder);
        mo.setProduct(product);
        mo.setQuantity(quantity);
        mo.setStatus("PLANNED");
        mo.setStartDate(startDate);
        mo.setEndDate(endDate);
        mo.setTechnicalNotes(technicalNotes);

        manufactureOrderRepository.save(mo);
        log.info("✏️ Quản đốc đã tự xếp lịch thủ công thành công MO: {} | Từ {} đến {}", mo.getMoNumber(), mo.getStartDate(), mo.getEndDate());

        return mo;
    }

    // Hàm isOverlapping giữ nguyên như cũ nhé!

    // --- HELPER: Kiểm tra xem 1 khoảng thời gian có đè lên MO nào đang có không ---
    private boolean isOverlapping(LocalDateTime start, LocalDateTime end, List<ManufactureOrder> existingMOs) {
        for (ManufactureOrder mo : existingMOs) {
            // Điều kiện Overlap: Thời điểm bắt đầu của Ca < Thời điểm kết thúc của MO
            // VÀ Thời điểm kết thúc của Ca > Thời điểm bắt đầu của MO
            if (start.isBefore(mo.getEndDate()) && end.isAfter(mo.getStartDate())) {
                return true; // Bị trùng
            }
        }
        return false; // Trống lịch, có thể dùng
    }
}