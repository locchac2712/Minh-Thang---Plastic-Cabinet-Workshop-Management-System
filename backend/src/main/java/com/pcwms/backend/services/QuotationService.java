package com.pcwms.backend.services;

import com.pcwms.backend.dto.request.QuotationRequest;
import com.pcwms.backend.entity.*;
import com.pcwms.backend.repository.*;
import org.hibernate.dialect.function.array.ArrayContainsUnnestFunction;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Transactional // Đảm bảo lỗi ở đâu thì rollback lại toàn bộ
    public Quotation createQuotation(QuotationRequest request) {

        // 1. Kiểm tra Customer và Staff có tồn tại không
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Khách hàng!"));
        Staff staff = staffRepository.findById(request.getStaffId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Nhân viên!"));

        // 2. Khởi tạo Báo Giá
        Quotation quotation = new Quotation();

        // Tự động sinh mã Báo giá chuẩn form UI (VD: BG-2026-3182)
        String year = String.valueOf(LocalDateTime.now().getYear());
        int randomNum = 1000 + new java.util.Random().nextInt(9000); // Random từ 1000 đến 9999
        quotation.setQuotationNumber("BG-" + year + "-" + randomNum);

        quotation.setCustomer(customer);
        quotation.setStaff(staff);
        quotation.setValidUntil(request.getValidUntil());
        quotation.setNote(request.getNote());
        quotation.setStatus("DRAFT"); // Mặc định là Nháp (Draft)

        BigDecimal grandTotal = BigDecimal.ZERO;

        // 3. Xử lý từng dòng sản phẩm (Detail)
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (QuotationRequest.QuotationDetailRequest itemReq : request.getItems()) {
                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Sản phẩm ID " + itemReq.getProductId()));

                QuotationDetail detail = new QuotationDetail();
                detail.setProduct(product);
                detail.setQuantity(itemReq.getQuantity());
                detail.setUnitPrice(itemReq.getUnitPrice());

                // TÍNH TOÁN CHIẾT KHẤU VÀ THÀNH TIỀN
                BigDecimal quantityBD = new BigDecimal(itemReq.getQuantity());
                BigDecimal basePrice = quantityBD.multiply(itemReq.getUnitPrice()); // Tiền gốc = SL * Đơn giá

                BigDecimal discountAmount = BigDecimal.ZERO;
                // Nếu FE truyền % > 0 thì bắt đầu tính ra tiền mặt
                if (itemReq.getDiscountPercent() != null && itemReq.getDiscountPercent() > 0) {
                    BigDecimal percent = BigDecimal.valueOf(itemReq.getDiscountPercent()).divide(BigDecimal.valueOf(100));
                    discountAmount = basePrice.multiply(percent);
                }

                // Lưu số TIỀN MẶT chiết khấu xuống DB để Kế toán dễ làm việc
                detail.setDiscount(discountAmount);

                // Total Line = Tiền gốc - Tiền chiết khấu
                BigDecimal lineTotal = basePrice.subtract(discountAmount);
                detail.setTotalLineAmount(lineTotal);

                // Cộng dồn vào Tổng tiền tờ báo giá
                grandTotal = grandTotal.add(lineTotal);

                // Nối Detail vào Quotation
                quotation.addDetail(detail);
            }
        } else {
            throw new RuntimeException("Lỗi: Báo giá phải có ít nhất 1 sản phẩm!");
        }

        // 4. Chốt hạ Tổng tiền và Lưu Database
        quotation.setTotalAmount(grandTotal);

        return quotationRepository.save(quotation);
    }

    @Transactional
    public Quotation updateQuotation(Long id, String status) {
        Quotation quotation = quotationRepository.findById(id).orElseThrow(() -> new RuntimeException("Lôĩ không tìm thấy báo giá ID: " + id))   ;
        // 1. Chỉ cho phép các trạng thái này được lọt qua
        List<String> validStatuses = List.of("DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED");
        if (!validStatuses.contains(status.toUpperCase())) {
            throw new RuntimeException("Lỗi: Trạng thái không hợp lệ! Chỉ nhận DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED.");
        }
        // 2. Chặn logic: Nếu báo giá đã chốt (ACCEPTED) thì cấm quay xe về Nháp (DRAFT)
        if ("ACCEPTED".equals(quotation.getStatus()) && !"ACCEPTED".equals(status.toUpperCase())) {
            throw new RuntimeException("Lỗi: Báo giá này đã được chốt đơn, không thể lùi trạng thái về " + status);
        }
        // 3. Cập nhật và lưu DB
        quotation.setStatus(status.toUpperCase());
        Quotation savedQuotation = quotationRepository.save(quotation);

        // 💡 TINH HOA Ở ĐÂY: Nếu status là ACCEPTED, ta sẽ gọi hàm sinh Đơn Hàng (Sales Order)
        if ("ACCEPTED".equals(savedQuotation.getStatus())) {
            System.out.println("🚀 KHÁCH ĐÃ CHỐT DEAL: Chuẩn bị kích hoạt luồng tự động tạo Sales Order!");
            // TODO: Gọi hàm createSalesOrderFromQuotation(savedQuotation) ở bước tiếp theo
        }
        return savedQuotation;
    }
}