package com.pcwms.backend.services;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import com.pcwms.backend.dto.request.QuotationRequest;
import com.pcwms.backend.entity.*;
import com.pcwms.backend.repository.*;
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

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT) // 👉 Chặn triệt để lỗi UnnecessaryStubbingException
class QuotationServiceTest {

    @Mock private QuotationRepository quotationRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private StaffRepository staffRepository;
    @Mock private ProductRepository productRepository;

    @InjectMocks
    private QuotationService quotationService;

    private Customer mockCustomer;
    private Staff mockStaff;
    private Product mockProduct;

    @BeforeEach
    void setUp() {
        mockCustomer = new Customer();
        mockCustomer.setId(1L);
        mockCustomer.setName("Khách hàng Test");

        mockStaff = new Staff();
        mockStaff.setId(1L);
        mockStaff.setFullname("Nhân viên Test");

        mockProduct = new Product();
        mockProduct.setId(10L);
        mockProduct.setName("Sản phẩm A");
        mockProduct.setSellingPrice(new BigDecimal("100000"));
    }

    // ==========================================
    // NHÓM 1: TEST TẠO BÁO GIÁ (CREATE)
    // ==========================================

    @Test
    @DisplayName("CR01: Tạo báo giá thành công - Kiểm tra tính toán chiết khấu và tổng tiền")
    void createQuotation_Success_CalculationCheck() {
        QuotationRequest.QuotationDetailRequest itemReq = new QuotationRequest.QuotationDetailRequest();
        itemReq.setProductId(10L);
        itemReq.setQuantity(2);
        itemReq.setUnitPrice(new BigDecimal("100000"));
        itemReq.setDiscountPercent(10.0);

        QuotationRequest request = new QuotationRequest();
        request.setCustomerId(1L);
        request.setStaffId(1L);
        request.setItems(List.of(itemReq));

        lenient().when(customerRepository.findById(1L)).thenReturn(Optional.of(mockCustomer));
        lenient().when(staffRepository.findById(1L)).thenReturn(Optional.of(mockStaff));
        lenient().when(productRepository.findById(10L)).thenReturn(Optional.of(mockProduct));

        lenient().when(quotationRepository.save(any(Quotation.class))).thenAnswer(invocation -> {
            Quotation q = invocation.getArgument(0);
            q.setId(100L);
            return q;
        });
        lenient().when(quotationRepository.findById(any())).thenReturn(Optional.of(new Quotation()));

        quotationService.createQuotation(request);

        ArgumentCaptor<Quotation> captor = ArgumentCaptor.forClass(Quotation.class);
        verify(quotationRepository).save(captor.capture());
        Quotation saved = captor.getValue();

        // Kiểm tra logic: (2 * 100,000) = 200,000. Chiết khấu 10% = 20,000. Tổng = 180,000.
        assertEquals(0, new BigDecimal("180000.0").compareTo(saved.getTotalAmount()));
        assertEquals(0, new BigDecimal("20000.0").compareTo(saved.getDetails().get(0).getDiscount()));
        assertEquals("DRAFT", saved.getStatus());
    }

    @Test
    @DisplayName("CR02: Thất bại khi danh sách sản phẩm trống")
    void createQuotation_Fail_ItemsNull() {
        QuotationRequest request = new QuotationRequest();
        request.setCustomerId(1L);
        request.setStaffId(1L);
        request.setItems(null);

        lenient().when(customerRepository.findById(1L)).thenReturn(Optional.of(mockCustomer));
        lenient().when(staffRepository.findById(1L)).thenReturn(Optional.of(mockStaff));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> quotationService.createQuotation(request));
        assertEquals("Lỗi: Báo giá phải có ít nhất 1 sản phẩm!", ex.getMessage());
    }

    @Test
    @DisplayName("CR03: Đào Sâu - Bắn lỗi ngay nếu Số lượng <= 0")
    void createQuotation_Deep_Fail_NegativeQuantity() {
        QuotationRequest.QuotationDetailRequest itemReq = new QuotationRequest.QuotationDetailRequest();
        itemReq.setProductId(10L);
        itemReq.setQuantity(0); // LỖI
        itemReq.setUnitPrice(new BigDecimal("100000"));

        QuotationRequest request = new QuotationRequest();
        request.setCustomerId(1L);
        request.setStaffId(1L);
        request.setItems(List.of(itemReq));

        lenient().when(customerRepository.findById(1L)).thenReturn(Optional.of(mockCustomer));
        lenient().when(staffRepository.findById(1L)).thenReturn(Optional.of(mockStaff));
        lenient().when(productRepository.findById(10L)).thenReturn(Optional.of(mockProduct));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> quotationService.createQuotation(request));
        assertEquals("Lỗi: Số lượng sản phẩm phải lớn hơn 0!", ex.getMessage());
    }

    @Test
    @DisplayName("CR04: Đào Sâu - Bắn lỗi nếu Chiết khấu > 100%")
    void createQuotation_Deep_Fail_DiscountOver100() {
        QuotationRequest.QuotationDetailRequest itemReq = new QuotationRequest.QuotationDetailRequest();
        itemReq.setProductId(10L);
        itemReq.setQuantity(2);
        itemReq.setUnitPrice(new BigDecimal("100000"));
        itemReq.setDiscountPercent(150.0); // LỖI: Chiết khấu 150%

        QuotationRequest request = new QuotationRequest();
        request.setCustomerId(1L);
        request.setStaffId(1L);
        request.setItems(List.of(itemReq));

        lenient().when(customerRepository.findById(1L)).thenReturn(Optional.of(mockCustomer));
        lenient().when(staffRepository.findById(1L)).thenReturn(Optional.of(mockStaff));
        lenient().when(productRepository.findById(10L)).thenReturn(Optional.of(mockProduct));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> quotationService.createQuotation(request));
        assertEquals("Lỗi: Phần trăm chiết khấu phải nằm trong khoảng từ 0% đến 100%!", ex.getMessage());
    }

    // ==========================================
    // NHÓM 2: TEST MÁY TRẠNG THÁI (STATE MACHINE)
    // ==========================================

    @Test
    @DisplayName("ST01: Chuyển trạng thái từ DRAFT sang WAITING_APPROVAL - Thành công")
    void updateStatus_DraftToWaiting_Success() {
        Quotation mockQuotation = new Quotation();
        mockQuotation.setId(1L);
        mockQuotation.setStatus("DRAFT");

        lenient().when(quotationRepository.findById(1L)).thenReturn(Optional.of(mockQuotation));
        lenient().when(quotationRepository.save(any(Quotation.class))).thenAnswer(i -> i.getArgument(0));

        Quotation result = quotationService.updateQuotationStatus(1L, "WAITING_APPROVAL", "Gửi duyệt");

        assertEquals("WAITING_APPROVAL", result.getStatus());
    }

    @Test
    @DisplayName("ST02: Chặn 'Quay xe' khi báo giá đã ACCEPTED")
    void updateStatus_Fail_WhenAlreadyAccepted() {
        Quotation mockQuotation = new Quotation();
        mockQuotation.setId(1L);
        mockQuotation.setStatus("ACCEPTED"); // Đã chốt với khách

        lenient().when(quotationRepository.findById(1L)).thenReturn(Optional.of(mockQuotation));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> quotationService.updateQuotationStatus(1L, "DRAFT", "Sửa lại"));

        assertTrue(ex.getMessage().contains("Báo giá đã đóng"));
    }

    @Test
    @DisplayName("ST03: Cho phép Sếp từ chối (REJECTED) mà không cần ghi lý do")
    void updateStatus_Success_RejectedWithoutNote() {
        Quotation mockQuotation = new Quotation();
        mockQuotation.setId(1L);
        mockQuotation.setStatus("WAITING_APPROVAL");

        lenient().when(quotationRepository.findById(1L)).thenReturn(Optional.of(mockQuotation));
        lenient().when(quotationRepository.save(any(Quotation.class))).thenAnswer(i -> i.getArgument(0));

        // Note truyền vào là rỗng
        Quotation result = quotationService.updateQuotationStatus(1L, "REJECTED", "   ");

        assertEquals("REJECTED", result.getStatus());
        assertNull(result.getApprovalNote());
    }

    @Test
    @DisplayName("ST04: Sếp quay xe, duyệt luôn báo giá đang bị REJECTED")
    void updateStatus_Success_ApproveFromRejected() {
        Quotation mockQuotation = new Quotation();
        mockQuotation.setId(1L);
        mockQuotation.setStatus("REJECTED"); // Đang bị từ chối

        lenient().when(quotationRepository.findById(1L)).thenReturn(Optional.of(mockQuotation));
        lenient().when(quotationRepository.save(any(Quotation.class))).thenAnswer(i -> i.getArgument(0));

        // Duyệt thẳng
        Quotation result = quotationService.updateQuotationStatus(1L, "APPROVED", "Thôi duyệt cho em nó!");

        assertEquals("APPROVED", result.getStatus());
        assertEquals("Thôi duyệt cho em nó!", result.getApprovalNote());
    }

    // ==========================================
    // NHÓM 3: TEST CẬP NHẬT NỘI DUNG (UPDATE QUOTATION)
    // ==========================================

    @Test
    @DisplayName("UP01: Sửa báo giá thành công - Xóa cũ nạp mới")
    void updateQuotation_Success_ClearAndAdd() {
        Quotation existingQuotation = new Quotation();
        existingQuotation.setId(1L);
        existingQuotation.setStatus("DRAFT");
        existingQuotation.setDetails(new ArrayList<>()); // Tránh NullPointerException khi clear()

        QuotationRequest request = new QuotationRequest();
        QuotationRequest.QuotationDetailRequest newItem = new QuotationRequest.QuotationDetailRequest();
        newItem.setProductId(10L);
        newItem.setQuantity(5);
        newItem.setUnitPrice(new BigDecimal("20000"));
        request.setItems(List.of(newItem));

        lenient().when(quotationRepository.findById(1L)).thenReturn(Optional.of(existingQuotation));
        lenient().when(productRepository.findById(10L)).thenReturn(Optional.of(mockProduct));
        lenient().when(quotationRepository.save(any(Quotation.class))).thenAnswer(i -> i.getArgument(0));
        lenient().when(quotationRepository.findById(any())).thenReturn(Optional.of(existingQuotation));

        quotationService.updateQuotation(1L, request);

        // Kiểm tra hàm clear và flush có được gọi để dọn dẹp detail cũ không
        verify(quotationRepository).flush();
        // Kiểm tra tổng tiền mới: 5 * 20,000 = 100,000
        assertEquals(0, new BigDecimal("100000").compareTo(existingQuotation.getTotalAmount()));
    }
}