package com.pcwms.backend.services;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import com.pcwms.backend.dto.response.SalesOrderDetailResponse;
import com.pcwms.backend.dto.response.SalesOrderListResponse;
import com.pcwms.backend.entity.*;
import com.pcwms.backend.repository.QuotationRepository;
import com.pcwms.backend.repository.SalesOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT) // Chặn lỗi UnnecessaryStubbing
class SalesOrderServiceTest {

    @Mock
    private SalesOrderRepository salesOrderRepository;

    @Mock
    private QuotationRepository quotationRepository;

    @InjectMocks
    private SalesOrderService salesOrderService;

    private Customer mockCustomer;
    private Quotation mockQuotation;
    private Product mockProduct;

    @BeforeEach
    void setUp() {
        // 1. Setup Khách hàng mặc định
        mockCustomer = new Customer();
        mockCustomer.setId(1L);
        mockCustomer.setName("Công ty TNHH Test");
        // Mặc định khách sạch nợ và có hạn mức 100 triệu
        mockCustomer.setCurrentDebt(BigDecimal.ZERO);
        mockCustomer.setCreditLimit(new BigDecimal("100000000"));

        // 2. Setup Sản phẩm
        mockProduct = new Product();
        mockProduct.setId(10L);
        mockProduct.setName("Sản phẩm Nhựa A");

        // 3. Setup Báo giá (Đã chốt)
        mockQuotation = new Quotation();
        mockQuotation.setId(100L);
        mockQuotation.setStatus("ACCEPTED"); // Trạng thái hợp lệ
        mockQuotation.setCustomer(mockCustomer);
        mockQuotation.setTotalAmount(new BigDecimal("50000000")); // Đơn giá 50 triệu

        // Thêm 1 chi tiết vào báo giá
        QuotationDetail qDetail = new QuotationDetail();
        qDetail.setProduct(mockProduct);
        qDetail.setQuantity(100);
        qDetail.setUnitPrice(new BigDecimal("500000"));
        qDetail.setDiscount(BigDecimal.ZERO);

        List<QuotationDetail> details = new ArrayList<>();
        details.add(qDetail);
        mockQuotation.setDetails(details);
    }

    // ==========================================================
    // NHÓM 1: TEST TRẠM KIỂM SOÁT TÍN DỤNG (CREDIT CHECK)
    // ==========================================================

    @Test
    @DisplayName("SO-01: Tạo đơn tự động THÀNH CÔNG (Khách sạch nợ, Đơn < Hạn mức)")
    void generateOrder_Success_WaitingForDeposit() {
        // GIVEN: Hạn mức 100tr, Nợ 0, Đơn 50tr (Đã setup ở BeforeEach)
        lenient().when(quotationRepository.findById(100L)).thenReturn(Optional.of(mockQuotation));
        lenient().when(salesOrderRepository.existsByQuotationId(100L)).thenReturn(false);
        lenient().when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(i -> i.getArgument(0));

        // WHEN
        SalesOrder result = salesOrderService.generateFromQuotation(100L);

        // THEN
        assertEquals("WAITING_FOR_DEPOSIT", result.getStatus(), "Phải được tự động duyệt vì an toàn tín dụng!");
        assertEquals("UNPAID", result.getPaymentStatus());
        assertNotNull(result.getOrderNumber());
        assertEquals(0, new BigDecimal("50000000").compareTo(result.getTotalAmount()));

        // Kiểm tra chi tiết đơn hàng có được copy sang không
        ArgumentCaptor<SalesOrder> captor = ArgumentCaptor.forClass(SalesOrder.class);
        verify(salesOrderRepository).save(captor.capture());
        assertFalse(captor.getValue().getDetails().isEmpty(), "Phải copy chi tiết sản phẩm từ báo giá!");
    }

    @Test
    @DisplayName("SO-02: Khóa đơn chờ duyệt (Khách đang CÓ NỢ CŨ)")
    void generateOrder_Pending_HasCurrentDebt() {
        // GIVEN: Khách đang nợ 10 triệu
        mockCustomer.setCurrentDebt(new BigDecimal("10000000"));

        lenient().when(quotationRepository.findById(100L)).thenReturn(Optional.of(mockQuotation));
        lenient().when(salesOrderRepository.existsByQuotationId(100L)).thenReturn(false);
        lenient().when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(i -> i.getArgument(0));

        // WHEN
        SalesOrder result = salesOrderService.generateFromQuotation(100L);

        // THEN
        assertEquals("PENDING_APPROVAL", result.getStatus(), "Có nợ là phải khóa ngay!");
    }

    @Test
    @DisplayName("SO-03: Khóa đơn chờ duyệt (Khách sạch nợ nhưng Đơn VƯỢT HẠN MỨC)")
    void generateOrder_Pending_OverCreditLimit() {
        // GIVEN: Khách sạch nợ, nhưng Hạn mức chỉ có 20 triệu. Đơn hàng trị giá 50 triệu.
        mockCustomer.setCurrentDebt(BigDecimal.ZERO);
        mockCustomer.setCreditLimit(new BigDecimal("20000000"));

        lenient().when(quotationRepository.findById(100L)).thenReturn(Optional.of(mockQuotation));
        lenient().when(salesOrderRepository.existsByQuotationId(100L)).thenReturn(false);
        lenient().when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(i -> i.getArgument(0));

        // WHEN
        SalesOrder result = salesOrderService.generateFromQuotation(100L);

        // THEN
        assertEquals("PENDING_APPROVAL", result.getStatus(), "Đơn to hơn hạn mức cho phép -> Phải chờ Sếp duyệt!");
    }

    // ==========================================================
    // NHÓM 2: TEST BẮT LỖI NGHIỆP VỤ & RÀNG BUỘC
    // ==========================================================

    @Test
    @DisplayName("SO-04: Bắn lỗi nếu Báo giá chưa được ACCEPTED")
    void generateOrder_Fail_QuotationNotAccepted() {
        // GIVEN: Báo giá mới ở dạng DRAFT
        mockQuotation.setStatus("DRAFT");
        lenient().when(quotationRepository.findById(100L)).thenReturn(Optional.of(mockQuotation));

        // WHEN & THEN
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> salesOrderService.generateFromQuotation(100L));
        assertTrue(ex.getMessage().contains("Báo giá chưa được khách chốt"));
    }

    @Test
    @DisplayName("SO-05: Bắn lỗi chống tạo đúp (1 Báo giá -> 2 Đơn hàng)")
    void generateOrder_Fail_AlreadyExists() {
        // GIVEN: Báo giá hợp lệ nhưng Database báo đã tồn tại Đơn hàng cho Báo giá này
        lenient().when(quotationRepository.findById(100L)).thenReturn(Optional.of(mockQuotation));
        lenient().when(salesOrderRepository.existsByQuotationId(100L)).thenReturn(true); // Lỗi ở đây

        // WHEN & THEN
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> salesOrderService.generateFromQuotation(100L));
        assertTrue(ex.getMessage().contains("đã được tạo Đơn Hàng rồi"));
    }

    @Test
    @DisplayName("SO-06: Bắn lỗi nếu ID Báo giá không tồn tại")
    void generateOrder_Fail_QuotationNotFound() {
        lenient().when(quotationRepository.findById(999L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> salesOrderService.generateFromQuotation(999L));
        assertTrue(ex.getMessage().contains("Không tìm thấy Báo giá"));
    }

    // ==========================================================
    // NHÓM 3: TEST CÁC API TÌM KIẾM & PHÂN TRANG
    // ==========================================================

    @Test
    @DisplayName("SO-07: Lọc danh sách Đơn hàng - Xử lý chuỗi rỗng an toàn")
    void getAllSalesOrders_CleanStringParameters() {
        // GIVEN: Frontend gửi null hoặc chuỗi chỉ chứa dấu cách
        Pageable pageable = PageRequest.of(0, 10);
        Page<SalesOrder> emptyPage = new PageImpl<>(new ArrayList<>());

        // Mong đợi service sẽ clean data: "  " -> "", " pending " -> "PENDING"
        when(salesOrderRepository.searchSalesOrders("", "PENDING", null, 1L, pageable))
                .thenReturn(emptyPage);

        // WHEN
        Page<SalesOrderListResponse> result = salesOrderService.getAllSalesOrders("   ", " pending ", null, 1L, pageable);

        // THEN
        assertNotNull(result);
        verify(salesOrderRepository).searchSalesOrders("", "PENDING", null, 1L, pageable);
    }

    // ==========================================================
    // NHÓM 4: TEST API XEM CHI TIẾT ĐƠN HÀNG
    // ==========================================================

    @Test
    @DisplayName("SO-08: Xem chi tiết đơn hàng thành công")
    void getSalesOrderDetail_Success() {
        // GIVEN
        SalesOrder mockOrder = new SalesOrder();
        mockOrder.setId(1L);
        mockOrder.setOrderNumber("SO-2026-1234");
        mockOrder.setCustomer(mockCustomer); // Dùng lại mockCustomer ở hàm setUp()
        mockOrder.setDetails(new ArrayList<>()); // Tránh lỗi khi DTO map List

        lenient().when(salesOrderRepository.findById(1L)).thenReturn(Optional.of(mockOrder));

        // WHEN
        SalesOrderDetailResponse response = salesOrderService.getSalesOrderDetail(1L);

        // THEN
        assertNotNull(response);
        verify(salesOrderRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("SO-09: Bắn lỗi khi không tìm thấy Đơn hàng")
    void getSalesOrderDetail_Fail_NotFound() {
        // GIVEN
        lenient().when(salesOrderRepository.findById(999L)).thenReturn(Optional.empty());

        // WHEN & THEN
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> salesOrderService.getSalesOrderDetail(999L));
        assertTrue(ex.getMessage().contains("Không tìm thấy Đơn hàng ID: 999"));
    }

    // ==========================================================
    // NHÓM 5: TEST API HÀNG ĐỢI SẢN XUẤT (PRODUCTION QUEUE)
    // ==========================================================

    @Test
    @DisplayName("SO-10: Lấy danh sách chờ sản xuất - Xử lý sort và keyword rỗng")
    void getPaginatedProductionQueue_Success() {
        // GIVEN: Giả lập phân trang và sắp xếp đúng như code Service
        Sort sort = Sort.by("priorityLevel").ascending().and(Sort.by("createdDate").ascending());
        Pageable pageable = PageRequest.of(0, 10, sort);
        Page<SalesOrder> emptyPage = new PageImpl<>(new ArrayList<>());

        // Nếu keyword truyền vào là chuỗi khoảng trắng "   ", Service phải lọc thành null
        lenient().when(salesOrderRepository.findOrdersForProduction(null, pageable))
                .thenReturn(emptyPage);

        // WHEN
        Page<SalesOrderDetailResponse> response = salesOrderService.getPaginatedProductionQueue("   ", 0, 10);

        // THEN
        assertNotNull(response);
        // Xác nhận xem Repository có được gọi với keyword = null và pageable có chứa Sort không
        verify(salesOrderRepository, times(1)).findOrdersForProduction(null, pageable);
    }
}