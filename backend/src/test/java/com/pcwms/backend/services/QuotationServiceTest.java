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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT) // Cho phép lenient để tránh lỗi "Unnecessary stubbing"
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

    @Test
    @DisplayName("TC01: Tạo báo giá thành công - Kiểm tra tính toán chiết khấu và tổng tiền")
    void createQuotation_Success_CalculationCheck() {
        // GIVEN: 2 sản phẩm giá 100k, chiết khấu 10%
        QuotationRequest.QuotationDetailRequest itemReq = new QuotationRequest.QuotationDetailRequest();
        itemReq.setProductId(10L);
        itemReq.setQuantity(2);
        itemReq.setUnitPrice(new BigDecimal("100000"));
        itemReq.setDiscountPercent(10.0);

        QuotationRequest request = new QuotationRequest();
        request.setCustomerId(1L);
        request.setStaffId(1L);
        request.setItems(List.of(itemReq));

        when(customerRepository.findById(1L)).thenReturn(Optional.of(mockCustomer));
        when(staffRepository.findById(1L)).thenReturn(Optional.of(mockStaff));
        when(productRepository.findById(10L)).thenReturn(Optional.of(mockProduct));

        // Mock lưu DB
        when(quotationRepository.save(any(Quotation.class))).thenAnswer(invocation -> {
            Quotation q = invocation.getArgument(0);
            q.setId(100L); // Giả lập ID tự sinh
            return q;
        });

        // Dòng cuối service có findById để load lại dữ liệu
        when(quotationRepository.findById(100L)).thenReturn(Optional.of(new Quotation()));

        // WHEN
        quotationService.createQuotation(request);

        // THEN
        ArgumentCaptor<Quotation> captor = ArgumentCaptor.forClass(Quotation.class);
        verify(quotationRepository).save(captor.capture());
        Quotation saved = captor.getValue();

        // Kiểm tra logic: (2 * 100,000) = 200,000. Chiết khấu 10% = 20,000. Tổng = 180,000.
        BigDecimal expectedDiscount = new BigDecimal("20000.0");
        BigDecimal expectedTotal = new BigDecimal("180000.0");

        assertEquals(0, expectedTotal.compareTo(saved.getTotalAmount()), "Tổng tiền báo giá sai!");
        assertEquals(1, saved.getDetails().size());
        assertEquals(0, expectedDiscount.compareTo(saved.getDetails().get(0).getDiscount()), "Tiền chiết khấu dòng sai!");
        assertEquals("DRAFT", saved.getStatus());
        assertNotNull(saved.getQuotationNumber());
    }

    @Test
    @DisplayName("TC02: Thất bại khi danh sách sản phẩm (items) null")
    void createQuotation_Fail_ItemsNull() {
        QuotationRequest request = new QuotationRequest();
        request.setCustomerId(1L);
        request.setStaffId(1L);
        request.setItems(null);

        when(customerRepository.findById(1L)).thenReturn(Optional.of(mockCustomer));
        when(staffRepository.findById(1L)).thenReturn(Optional.of(mockStaff));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> quotationService.createQuotation(request));
        assertEquals("Lỗi: Báo giá phải có ít nhất 1 sản phẩm!", ex.getMessage());
    }

    @Test
    @DisplayName("TC03: Thất bại khi không tìm thấy một Sản phẩm trong danh sách")
    void createQuotation_Fail_ProductNotFound() {
        QuotationRequest.QuotationDetailRequest itemReq = new QuotationRequest.QuotationDetailRequest();
        itemReq.setProductId(999L); // ID ảo

        QuotationRequest request = new QuotationRequest();
        request.setCustomerId(1L);
        request.setStaffId(1L);
        request.setItems(List.of(itemReq));

        when(customerRepository.findById(1L)).thenReturn(Optional.of(mockCustomer));
        when(staffRepository.findById(1L)).thenReturn(Optional.of(mockStaff));
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> quotationService.createQuotation(request));
        assertTrue(ex.getMessage().contains("Không tìm thấy Sản phẩm ID 999"));
    }

    @Test
    @DisplayName("TC04: Kiểm tra chiết khấu khi DiscountPercent là 0 hoặc null")
    void createQuotation_Success_NoDiscount() {
        QuotationRequest.QuotationDetailRequest itemReq = new QuotationRequest.QuotationDetailRequest();
        itemReq.setProductId(10L);
        itemReq.setQuantity(1);
        itemReq.setUnitPrice(new BigDecimal("50000"));
        itemReq.setDiscountPercent(0.0); // Hoặc null

        QuotationRequest request = new QuotationRequest();
        request.setCustomerId(1L);
        request.setStaffId(1L);
        request.setItems(List.of(itemReq));

        when(customerRepository.findById(1L)).thenReturn(Optional.of(mockCustomer));
        when(staffRepository.findById(1L)).thenReturn(Optional.of(mockStaff));
        when(productRepository.findById(10L)).thenReturn(Optional.of(mockProduct));
        when(quotationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(quotationRepository.findById(any())).thenReturn(Optional.of(new Quotation()));

        quotationService.createQuotation(request);

        ArgumentCaptor<Quotation> captor = ArgumentCaptor.forClass(Quotation.class);
        verify(quotationRepository).save(captor.capture());

        // Chiết khấu phải bằng 0
        assertEquals(0, BigDecimal.ZERO.compareTo(captor.getValue().getDetails().get(0).getDiscount()));
        assertEquals(0, new BigDecimal("50000").compareTo(captor.getValue().getTotalAmount()));
    }

    @Test
    @DisplayName("TC05: Thất bại khi Staff không tồn tại")
    void createQuotation_Fail_StaffNotFound() {
        QuotationRequest request = new QuotationRequest();
        request.setCustomerId(1L);
        request.setStaffId(88L);

        when(customerRepository.findById(1L)).thenReturn(Optional.of(mockCustomer));
        when(staffRepository.findById(88L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> quotationService.createQuotation(request));
    }

    //UPDATE QUOTATUION STATUS
    @Test
    @DisplayName("ST01: Chuyển trạng thái từ DRAFT sang WAITING_APPROVAL - Thành công")
    void updateStatus_DraftToWaiting_Success() {
        // GIVEN
        Quotation mockQuotation = new Quotation();
        mockQuotation.setId(1L);
        mockQuotation.setStatus("DRAFT");

        when(quotationRepository.findById(1L)).thenReturn(Optional.of(mockQuotation));
        when(quotationRepository.save(any(Quotation.class))).thenAnswer(i -> i.getArgument(0));

        // WHEN
        Quotation result = quotationService.updateQuotationStatus(1L, "WAITING_APPROVAL", "Gửi duyệt");

        // THEN
        assertEquals("WAITING_APPROVAL", result.getStatus());
        verify(quotationRepository).save(any());
    }

    @Test
    @DisplayName("ST02: Chặn 'Quay xe' khi báo giá đã ACCEPTED")
    void updateStatus_Fail_WhenAlreadyAccepted() {
        // GIVEN: Báo giá đã chốt thì không được đổi sang bất kỳ trạng thái nào khác
        Quotation mockQuotation = new Quotation();
        mockQuotation.setId(1L);
        mockQuotation.setStatus("ACCEPTED");

        when(quotationRepository.findById(1L)).thenReturn(Optional.of(mockQuotation));

        // WHEN & THEN
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> quotationService.updateQuotationStatus(1L, "DRAFT", "Sửa lại"));

        assertTrue(ex.getMessage().contains("Báo giá đã đóng"));
    }

    @Test
    @DisplayName("ST03: Sai quy trình - Duyệt (APPROVED) khi chưa chờ duyệt (WAITING_APPROVAL)")
    void updateStatus_Fail_ApprovedWithoutWaiting() {
        // GIVEN: Đang là nháp mà Giám đốc đòi Duyệt luôn là sai quy trình
        Quotation mockQuotation = new Quotation();
        mockQuotation.setId(1L);
        mockQuotation.setStatus("DRAFT");

        when(quotationRepository.findById(1L)).thenReturn(Optional.of(mockQuotation));

        // WHEN & THEN
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> quotationService.updateQuotationStatus(1L, "APPROVED", "Duyệt luôn"));

        assertTrue(ex.getMessage().contains("chỉ có thể Duyệt/Từ chối báo giá đang ở trạng thái WAITING_APPROVAL"));
    }

    @Test
    @DisplayName("ST04: Kiểm tra lưu Note của Giám đốc khi REJECTED")
    void updateStatus_SaveApprovalNote_WhenRejected() {
        // GIVEN
        Quotation mockQuotation = new Quotation();
        mockQuotation.setId(1L);
        mockQuotation.setStatus("WAITING_APPROVAL");

        when(quotationRepository.findById(1L)).thenReturn(Optional.of(mockQuotation));
        when(quotationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // WHEN
        Quotation result = quotationService.updateQuotationStatus(1L, "REJECTED", "Giá quá thấp, tính lại đi!");

        // THEN
        assertEquals("REJECTED", result.getStatus());
        assertEquals("Giá quá thấp, tính lại đi!", result.getApprovalNote());
    }
    //UPDATE QUOTATION
    @Test
    @DisplayName("UP01: Sửa báo giá thành công - Xóa cũ nạp mới")
    void updateQuotation_Success_ClearAndAdd() {
        // 1. GIVEN
        Quotation existingQuotation = new Quotation();
        existingQuotation.setId(1L);
        existingQuotation.setStatus("DRAFT");

        QuotationRequest request = new QuotationRequest();
        // Đảm bảo có items để code chạy vào vòng lặp for
        QuotationRequest.QuotationDetailRequest newItem = new QuotationRequest.QuotationDetailRequest();
        newItem.setProductId(10L);
        newItem.setQuantity(5);
        newItem.setUnitPrice(new BigDecimal("20000"));
        request.setItems(List.of(newItem));

        // Mock các bước mà code CHẮC CHẮN sẽ đi qua
        when(quotationRepository.findById(1L)).thenReturn(Optional.of(existingQuotation));
        when(productRepository.findById(10L)).thenReturn(Optional.of(mockProduct));
        when(quotationRepository.save(any())).thenReturn(existingQuotation);

        // Nếu lỗi báo ở dòng findById cuối cùng, có thể do code chưa chạy tới đó đã crash
        when(quotationRepository.findById(any())).thenReturn(Optional.of(existingQuotation));

        // 2. WHEN
        quotationService.updateQuotation(1L, request);

        // 3. THEN
        verify(quotationRepository).flush();
    }
}