package com.pcwms.backend.services;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import com.pcwms.backend.entity.ManufactureOrder;
import com.pcwms.backend.entity.Product;
import com.pcwms.backend.entity.SalesOrder;
import com.pcwms.backend.repository.ManufactureOrderRepository;
import com.pcwms.backend.repository.ProductRepository;
import com.pcwms.backend.repository.SalesOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ManufactureOrderServiceTest {

    @Mock private ManufactureOrderRepository manufactureOrderRepository;
    @Mock private SalesOrderRepository salesOrderRepository;
    @Mock private ProductRepository productRepository;

    @InjectMocks
    private ManufactureOrderService manufactureOrderService;

    private SalesOrder mockSalesOrder;
    private Product mockProduct;

    // Các mốc thời gian test lý tưởng:
    // 10/04/2026: Thứ 6
    // 11/04/2026: Thứ 7
    // 12/04/2026: Chủ nhật
    // 13/04/2026: Thứ 2
    private final LocalDate FRIDAY = LocalDate.of(2026, 4, 10);
    private final LocalDate SUNDAY = LocalDate.of(2026, 4, 12);
    private final LocalDate DUE_DATE_SAFE = LocalDate.of(2026, 4, 20); // Deadline xa, an toàn

    @BeforeEach
    void setUp() {
        mockSalesOrder = new SalesOrder();
        mockSalesOrder.setId(1L);
        mockSalesOrder.setDueDate(DUE_DATE_SAFE);

        mockProduct = new Product();
        mockProduct.setId(10L);
        mockProduct.setName("Bàn Gỗ Phức Tạp");
        mockProduct.setEstimatedProductionHours(2.0); // 2 tiếng / sản phẩm

        lenient().when(salesOrderRepository.findById(1L)).thenReturn(Optional.of(mockSalesOrder));
        lenient().when(productRepository.findById(10L)).thenReturn(Optional.of(mockProduct));
        lenient().when(manufactureOrderRepository.findAllForCalendar()).thenReturn(new ArrayList<>());
        lenient().when(manufactureOrderRepository.save(any(ManufactureOrder.class))).thenAnswer(i -> i.getArgument(0));
    }

    // =================================================================
    // NHÓM 1: KIỂM TRA THUẬT TOÁN ĐÚC LỆNH TỰ ĐỘNG (FORWARD SCHEDULING)
    // =================================================================

    @Test
    @DisplayName("MO-01: Lên lịch THÀNH CÔNG (Thuận lợi, không kẹt Chủ Nhật)")
    void createMO_Success_NormalFlow() {
        // GIVEN: Cần làm 4 sản phẩm * 2 tiếng = 8 tiếng -> Cần 2 ca làm việc.
        // Bắt đầu: Sáng Thứ 6 (10/04/2026 lúc 09:00). Dự kiến Ca 1 và Ca 2 trong cùng ngày Thứ 6.
        LocalDateTime requestedStart = FRIDAY.atTime(9, 0);

        // WHEN
        ManufactureOrder result = manufactureOrderService.createManufactureOrder(
                1L, 10L, 4, "Sản xuất cẩn thận", requestedStart
        );

        // THEN
        assertNotNull(result);
        assertEquals("PLANNED", result.getStatus());
        // Kết thúc phải là 17:00 chiều Thứ 6 (Sau 2 ca)
        assertEquals(FRIDAY.atTime(17, 0), result.getEndDate());
        verify(manufactureOrderRepository).save(any());
    }

    @Test
    @DisplayName("MO-02: Lên lịch nhảy qua CHỦ NHẬT (Tự động chuyển sang Thứ 2)")
    void createMO_Success_SkipSunday() {
        // GIVEN: Cần làm 4 sản phẩm * 2 tiếng = 8 tiếng -> Cần 2 ca làm việc.
        // Bắt đầu: Chiều Thứ 7 (11/04 lúc 14:00). Ca 1 là chiều Thứ 7.
        // Theo luật: Ca 2 sẽ rơi vào Chủ Nhật -> Phải né và nhảy sang Sáng Thứ 2 (13/04).
        LocalDateTime saturdayAfternoon = LocalDate.of(2026, 4, 11).atTime(14, 0);

        // WHEN
        ManufactureOrder result = manufactureOrderService.createManufactureOrder(
                1L, 10L, 4, "Test né chủ nhật", saturdayAfternoon
        );

        // THEN
        assertNotNull(result);
        // Ca 2 kết thúc vào 12:00 trưa Thứ 2
        assertEquals(LocalDate.of(2026, 4, 13).atTime(12, 0), result.getEndDate());
    }

    @Test
    @DisplayName("MO-03: Thất bại do ĐỤNG ĐỘ LỊCH (Overlap) với MO khác")
    void createMO_Fail_Overlapping() {
        // GIVEN: Tạo 1 MO đang tồn tại chiếm dụng sáng Thứ 6 (Từ 08:00 đến 12:00)
        ManufactureOrder existingMO = new ManufactureOrder();
        existingMO.setStartDate(FRIDAY.atTime(8, 0));
        existingMO.setEndDate(FRIDAY.atTime(12, 0));
        lenient().when(manufactureOrderRepository.findAllForCalendar()).thenReturn(List.of(existingMO));

        // WHEN: Cố nhét một lịch mới vào 09:00 sáng Thứ 6
        LocalDateTime requestedStart = FRIDAY.atTime(9, 0);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                manufactureOrderService.createManufactureOrder(1L, 10L, 2, "Ghi chú", requestedStart)
        );
        assertTrue(ex.getMessage().contains("xưởng sẽ bị trùng lịch với một Lệnh khác đang chạy"));
    }

    @Test
    @DisplayName("MO-04: Thất bại do KHÔNG KỊP DEADLINE")
    void createMO_Fail_MissedDeadline() {
        // GIVEN: Due Date gắt gao (11/04/2026). Target Date (Due - 2) = 09/04/2026.
        mockSalesOrder.setDueDate(LocalDate.of(2026, 4, 11));

        // Nhét lệnh bắt đầu vào tận 10/04/2026 -> Chắc chắn trễ so với Target 09/04
        LocalDateTime requestedStart = FRIDAY.atTime(9, 0);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                manufactureOrderService.createManufactureOrder(1L, 10L, 2, "Ghi chú", requestedStart)
        );
        assertTrue(ex.getMessage().contains("CẢNH BÁO TRỄ HẠN"));
    }

    // =================================================================
    // NHÓM 2: KIỂM TRA BẮT LỖI DỮ LIỆU ĐẦU VÀO (VALIDATION)
    // =================================================================

    @Test
    @DisplayName("MO-05: Thất bại - Không có DueDate ở Đơn hàng")
    void createMO_Fail_MissingDueDate() {
        mockSalesOrder.setDueDate(null);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                manufactureOrderService.createManufactureOrder(1L, 10L, 2, "Ghi chú", FRIDAY.atTime(9, 0))
        );
        assertEquals("Đơn hàng chưa có Ngày giao (Due Date). Không thể lên lịch!", ex.getMessage());
    }

    @Test
    @DisplayName("MO-06: Thất bại - Sản phẩm chưa cấu hình Giờ sản xuất")
    void createMO_Fail_MissingEstimatedHours() {
        mockProduct.setEstimatedProductionHours(null);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                manufactureOrderService.createManufactureOrder(1L, 10L, 2, "Ghi chú", FRIDAY.atTime(9, 0))
        );
        assertTrue(ex.getMessage().contains("chưa được cài đặt 'Thời gian sản xuất dự kiến'"));
    }

    @Test
    @DisplayName("MO-07: Thất bại - Quản đốc không chọn Ngày bắt đầu")
    void createMO_Fail_NullRequestedStartDate() {
        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                manufactureOrderService.createManufactureOrder(1L, 10L, 2, "Ghi chú", null)
        );
        assertEquals("Quản đốc phải chọn Ngày bắt đầu dự kiến!", ex.getMessage());
    }

    // =================================================================
    // NHÓM 3: KIỂM TRA LÊN LỊCH THỦ CÔNG (MANUAL SCHEDULING)
    // =================================================================

    @Test
    @DisplayName("MO-08: Lên lịch thủ công THÀNH CÔNG")
    void createManualMO_Success() {
        LocalDateTime start = FRIDAY.atTime(8, 0);
        LocalDateTime end = FRIDAY.atTime(17, 0);

        ManufactureOrder result = manufactureOrderService.createManualManufactureOrder(
                1L, 10L, 10, "Làm gấp nhé", start, end
        );

        assertNotNull(result);
        assertEquals(start, result.getStartDate());
        assertEquals(end, result.getEndDate());
        assertTrue(result.getMoNumber().contains("MANUAL"));
    }

    @Test
    @DisplayName("MO-09: Lên lịch thủ công Thất bại - Ngày bắt đầu sau ngày kết thúc")
    void createManualMO_Fail_InvalidDates() {
        LocalDateTime start = FRIDAY.atTime(17, 0); // Bắt đầu chiều
        LocalDateTime end = FRIDAY.atTime(8, 0);    // Kết thúc sáng (Vô lý)

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                manufactureOrderService.createManualManufactureOrder(1L, 10L, 10, "Lỗi ngày", start, end)
        );
        assertEquals("Ngày bắt đầu không thể diễn ra sau ngày kết thúc!", ex.getMessage());
    }

    @Test
    @DisplayName("MO-10: Lên lịch thủ công Thất bại - Thiếu tham số thời gian")
    void createManualMO_Fail_NullDates() {
        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                manufactureOrderService.createManualManufactureOrder(1L, 10L, 10, "Lỗi null", null, FRIDAY.atStartOfDay())
        );
        assertEquals("Bạn phải chọn cấu trúc Ngày bắt đầu và Ngày kết thúc!", ex.getMessage());
    }
}