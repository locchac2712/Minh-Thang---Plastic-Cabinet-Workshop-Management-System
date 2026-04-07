package com.pcwms.backend.services;

import com.pcwms.backend.dto.request.QuotationRequest;
import com.pcwms.backend.dto.response.QuotationDetailResponse;
import com.pcwms.backend.dto.response.QuotationListResponse;
import com.pcwms.backend.entity.*;
import com.pcwms.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class QuotationService {

    @Autowired
    private QuotationRepository quotationRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private StaffRepository staffRepository;
    @Autowired
    private ProductRepository productRepository;

    // 1. TẠO BÁO GIÁ MỚI
    @Transactional
    public Quotation createQuotation(QuotationRequest request) {

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Khách hàng!"));
        Staff staff = staffRepository.findById(request.getStaffId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Nhân viên!"));

        Quotation quotation = new Quotation();

        // Tự động sinh mã Báo giá
        String year = String.valueOf(LocalDateTime.now().getYear());
        int randomNum = 1000 + new java.util.Random().nextInt(9000);
        quotation.setQuotationNumber("BG-" + year + "-" + randomNum);

        quotation.setCustomer(customer);
        quotation.setStaff(staff);
        quotation.setValidUntil(request.getValidUntil());
        quotation.setNote(request.getNote());
        quotation.setStatus("DRAFT");

        BigDecimal grandTotal = BigDecimal.ZERO;

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (QuotationRequest.QuotationDetailRequest itemReq : request.getItems()) {

                // Chặn số lượng âm hoặc bằng 0
                if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                    throw new RuntimeException("Lỗi: Số lượng sản phẩm phải lớn hơn 0!");
                }

                // Chặn đơn giá âm
                if (itemReq.getUnitPrice() == null || itemReq.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                    throw new RuntimeException("Lỗi: Đơn giá sản phẩm không được âm!");
                }

                // Chặn chiết khấu vô lý (> 100% hoặc < 0%)
                Double discountPercent = itemReq.getDiscountPercent();
                if (discountPercent != null && (discountPercent < 0 || discountPercent > 100)) {
                    throw new RuntimeException("Lỗi: Phần trăm chiết khấu phải nằm trong khoảng từ 0% đến 100%!");
                }

                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Sản phẩm ID " + itemReq.getProductId()));

                QuotationDetail detail = new QuotationDetail();
                detail.setProduct(product);
                detail.setQuantity(itemReq.getQuantity());
                detail.setUnitPrice(itemReq.getUnitPrice());

                // Tính toán
                BigDecimal quantityBD = new BigDecimal(itemReq.getQuantity());
                BigDecimal basePrice = quantityBD.multiply(itemReq.getUnitPrice());
                BigDecimal discountAmount = BigDecimal.ZERO;

                if (discountPercent != null && discountPercent > 0) {
                    BigDecimal percent = BigDecimal.valueOf(discountPercent).divide(BigDecimal.valueOf(100));
                    discountAmount = basePrice.multiply(percent);
                }

                detail.setDiscount(discountAmount);
                BigDecimal lineTotal = basePrice.subtract(discountAmount);
                detail.setTotalLineAmount(lineTotal);
                grandTotal = grandTotal.add(lineTotal);

                // Nối Detail vào Quotation (Hàm addDetail của bạn đã xử lý 2 chiều rất tốt)
                quotation.addDetail(detail);
            }
        } else {
            throw new RuntimeException("Lỗi: Báo giá phải có ít nhất 1 sản phẩm!");
        }

        quotation.setTotalAmount(grandTotal);

        Quotation saved = quotationRepository.save(quotation);
        return quotationRepository.findById(saved.getId())
                .orElseThrow(() -> new RuntimeException("Lỗi khi tải lại báo giá"));
    }

    //  2. CẬP NHẬT TRẠNG THÁI (STATE MACHINE)
    @Transactional
    public Quotation updateQuotationStatus(Long id, String status, String note) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy báo giá ID: " + id));

        String currentStatus = quotation.getStatus();
        String newStatus = status.toUpperCase();

        List<String> validStatuses = List.of(
                "DRAFT", "WAITING_APPROVAL", "APPROVED", "REJECTED",
                "ACCEPTED", "CANCELLED", "EXPIRED"
        );

        if (!validStatuses.contains(newStatus)) {
            throw new RuntimeException("Lỗi: Trạng thái không hợp lệ!");
        }

        // Chặn quay xe nếu báo giá đã chốt với khách hoặc đã hủy/hết hạn
        if (List.of("ACCEPTED", "CANCELLED", "EXPIRED").contains(currentStatus)) {
            throw new RuntimeException("Lỗi: Báo giá đã đóng (ACCEPTED/CANCELLED/EXPIRED), không thể thay đổi trạng thái!");
        }

        switch (newStatus) {
            case "WAITING_APPROVAL":
                if (!"DRAFT".equals(currentStatus) && !"REJECTED".equals(currentStatus)) {
                    throw new RuntimeException("Chỉ báo giá DRAFT hoặc bị REJECTED mới được gửi đi chờ duyệt!");
                }
                break;

            case "APPROVED":
                //  Cho phép duyệt từ WAITING_APPROVAL hoặc duyệt luôn cả những cái đang REJECTED
                if (!"WAITING_APPROVAL".equals(currentStatus) && !"REJECTED".equals(currentStatus)) {
                    throw new RuntimeException("Giám đốc chỉ có thể Duyệt báo giá đang chờ (WAITING_APPROVAL) hoặc báo giá đã bị từ chối (REJECTED)!");
                }
                if (note != null && !note.trim().isEmpty()) {
                    quotation.setApprovalNote(note.trim());
                }
                break;

            case "REJECTED":
                if (!"WAITING_APPROVAL".equals(currentStatus)) {
                    throw new RuntimeException("Giám đốc chỉ có thể Từ chối báo giá đang ở trạng thái WAITING_APPROVAL!");
                }
                // 👉 THEO Ý BẠN: Đã bỏ đoạn check bắt buộc phải có Note. Có thì lưu, không có thì thôi.
                if (note != null && !note.trim().isEmpty()) {
                    quotation.setApprovalNote(note.trim());
                }
                break;

            case "ACCEPTED":
            case "CANCELLED":
                if (!"APPROVED".equals(currentStatus)) {
                    throw new RuntimeException("Báo giá phải được Giám đốc duyệt (APPROVED) trước khi chốt hoặc hủy với khách hàng!");
                }
                break;

            case "DRAFT":
                if (!"REJECTED".equals(currentStatus)) {
                    throw new RuntimeException("Chỉ có thể đưa về DRAFT để làm lại nếu báo giá bị Giám đốc REJECTED!");
                }
                break;
        }

        quotation.setStatus(newStatus);
        Quotation savedQuotation = quotationRepository.save(quotation);

        if ("ACCEPTED".equals(savedQuotation.getStatus())) {
            System.out.println("ACCEPTED: Đã chốt báo giá, chờ FE gọi API auto-fill để tạo đơn hàng!");
        }

        return savedQuotation;
    }

    // 3. CẬP NHẬT NỘI DUNG BÁO GIÁ
    @Transactional
    public Quotation updateQuotation(Long id, QuotationRequest request) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Báo giá ID " + id));

        if (!"DRAFT".equals(quotation.getStatus()) && !"REJECTED".equals(quotation.getStatus())) {
            throw new RuntimeException("Lỗi: Chỉ có thể sửa nội dung báo giá khi đang là Nháp (DRAFT) hoặc bị Giám đốc Từ chối (REJECTED)!");
        }

        quotation.setValidUntil(request.getValidUntil());
        quotation.setNote(request.getNote());

        quotation.getDetails().clear();
        quotationRepository.flush();

        BigDecimal grandTotal = BigDecimal.ZERO;

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (QuotationRequest.QuotationDetailRequest itemReq : request.getItems()) {

                // FIX 5: Mang các quy tắc bảo vệ toán học từ Create xuống Update
                if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                    throw new RuntimeException("Lỗi: Số lượng sản phẩm phải lớn hơn 0!");
                }
                if (itemReq.getUnitPrice() == null || itemReq.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                    throw new RuntimeException("Lỗi: Đơn giá sản phẩm không được âm!");
                }
                Double discountPercent = itemReq.getDiscountPercent();
                if (discountPercent != null && (discountPercent < 0 || discountPercent > 100)) {
                    throw new RuntimeException("Lỗi: Phần trăm chiết khấu phải nằm trong khoảng từ 0% đến 100%!");
                }

                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Sản phẩm ID " + itemReq.getProductId()));

                QuotationDetail detail = new QuotationDetail();
                detail.setProduct(product);
                detail.setQuantity(itemReq.getQuantity());
                detail.setUnitPrice(itemReq.getUnitPrice());

                BigDecimal quantityBD = new BigDecimal(itemReq.getQuantity());
                BigDecimal basePrice = quantityBD.multiply(itemReq.getUnitPrice());
                BigDecimal discountAmount = BigDecimal.ZERO;

                if (discountPercent != null && discountPercent > 0) {
                    BigDecimal percent = BigDecimal.valueOf(discountPercent).divide(BigDecimal.valueOf(100));
                    discountAmount = basePrice.multiply(percent);
                }

                detail.setDiscount(discountAmount);
                BigDecimal lineTotal = basePrice.subtract(discountAmount);
                detail.setTotalLineAmount(lineTotal);
                grandTotal = grandTotal.add(lineTotal);

                quotation.addDetail(detail);
            }
        } else {
            throw new RuntimeException("Lỗi: Báo giá cập nhật phải có ít nhất 1 sản phẩm!");
        }

        quotation.setTotalAmount(grandTotal);

        Quotation saved = quotationRepository.save(quotation);
        return quotationRepository.findById(saved.getId())
                .orElseThrow(() -> new RuntimeException("Lỗi khi tải lại báo giá"));
    }

    // 4. LẤY DANH SÁCH BÁO GIÁ
    public Page<QuotationListResponse> getAllQuotations(String keyword, String status, Long customerId, Pageable pageable) {
        String validKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String validStatus = (status != null && !status.trim().isEmpty()) ? status.trim().toUpperCase() : null;

        Page<Quotation> quotationPage = quotationRepository.searchQuotations(validKeyword, validStatus, customerId, pageable);
        return quotationPage.map(QuotationListResponse::new);
    }

    // 5. XEM CHI TIẾT BÁO GIÁ
    public QuotationDetailResponse getQuotationDetail(Long id) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Báo giá ID " + id));

        return new QuotationDetailResponse(quotation);
    }
}