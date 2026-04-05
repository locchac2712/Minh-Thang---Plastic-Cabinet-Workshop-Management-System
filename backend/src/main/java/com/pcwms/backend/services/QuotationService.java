package com.pcwms.backend.services;

import com.pcwms.backend.dto.request.QuotationRequest;
import com.pcwms.backend.dto.response.QuotationDetailResponse;
import com.pcwms.backend.entity.*;
import com.pcwms.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
 import org.springframework.data.domain.Page;
 import org.springframework.data.domain.Pageable;
 import com.pcwms.backend.dto.response.QuotationListResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

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
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private UserRepository userRepository;


    @Transactional // Đảm bảo lỗi ở đâu thì rollback lại toàn bộ
    public Quotation createQuotation(QuotationRequest request) {

        // 1. Kiểm tra Customer có tồn tại không
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Khách hàng!"));
        
        // 👉 Tự động lấy Staff dựa trên User đang đăng nhập thay vì dùng ID từ frontend vì User.id != Staff.id!
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy User đang đăng nhập!"));
        Staff staff = staffRepository.findByUser(currentUser)
                .orElseThrow(() -> new RuntimeException("Lỗi: User đang đăng nhập không được liên kết với hồ sơ Nhân viên nào!"));

        // 2. Khởi tạo Báo Giá
        Quotation quotation = new Quotation();
        quotation.setCustomer(customer);
        quotation.setStaff(staff);
        quotation.setNote(request.getNote());
        quotation.setStatus("DRAFT"); // Mặc định là Nháp (Draft)
        
        // 2.1 Validate chiết khấu tổng (Max 30%)
        BigDecimal discountPercent = request.getDiscountPercent() != null ? request.getDiscountPercent() : BigDecimal.ZERO;
        if (discountPercent.compareTo(new BigDecimal("30")) > 0) {
            throw new RuntimeException("Lỗi: Chiết khấu không được vượt quá 30% giá trị đơn hàng!");
        }
        quotation.setDiscountPercent(discountPercent);

        // Gán mã tạm
        quotation.setQuotationNumber("TEMP-" + UUID.randomUUID().toString().substring(0, 8));
        quotation = quotationRepository.save(quotation);
        
        // Format mã BG
        String year = String.valueOf(LocalDateTime.now().getYear());
        String formattedId = String.format("%04d", quotation.getId());
        quotation.setQuotationNumber("BG-" + year + "-" + formattedId);

        BigDecimal subTotal = BigDecimal.ZERO;

        // 3. Xử lý từng dòng sản phẩm
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (QuotationRequest.QuotationDetailRequest itemReq : request.getItems()) {
                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Sản phẩm ID " + itemReq.getProductId()));

                QuotationDetail detail = new QuotationDetail();
                detail.setProduct(product);
                detail.setQuantity(itemReq.getQuantity());
                detail.setUnitPrice(itemReq.getUnitPrice());

                // Tính tiền dòng (Chưa chiết khấu dòng nữa)
                BigDecimal quantityBD = new BigDecimal(itemReq.getQuantity());
                BigDecimal lineAmount = quantityBD.multiply(itemReq.getUnitPrice());
                detail.setTotalLineAmount(lineAmount);
                detail.setDiscount(BigDecimal.ZERO); // Không dùng chiết khấu dòng

                subTotal = subTotal.add(lineAmount);
                quotation.addDetail(detail);
            }
        } else {
            throw new RuntimeException("Lỗi: Báo giá phải có ít nhất 1 sản phẩm!");
        }

        // 4. Tính Tổng cộng sau chiết khấu đơn hàng
        BigDecimal discountMultiplier = BigDecimal.valueOf(100).subtract(discountPercent).divide(BigDecimal.valueOf(100));
        BigDecimal grandTotal = subTotal.multiply(discountMultiplier);
        
        quotation.setTotalAmount(grandTotal);

        Quotation saved = quotationRepository.save(quotation);
        return quotationRepository.findById(saved.getId())
                .orElseThrow(() -> new RuntimeException("Lỗi khi tải lại báo giá"));
    }

    @Transactional
    public Quotation updateQuotationStatus(Long id, String status, String reason, String note) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy báo giá ID: " + id));

        String currentStatus = quotation.getStatus();
        String newStatus = status.toUpperCase();

        // 1. Tập hợp các trạng thái hợp lệ trong luồng mới
        List<String> validStatuses = List.of(
                "DRAFT", "WAITING_APPROVAL", "APPROVED", "REJECTED",
                "ACCEPTED", "CANCELLED", "EXPIRED"
        );

        if (!validStatuses.contains(newStatus)) {
            throw new RuntimeException("Lỗi: Trạng thái không hợp lệ!");
        }

        // 2. CHẶN "QUAY XE" NẾU ĐÃ ĐÓNG BĂNG
        if (List.of("ACCEPTED", "CANCELLED", "EXPIRED").contains(currentStatus)) {
            throw new RuntimeException("Lỗi: Báo giá đã đóng (ACCEPTED/CANCELLED/EXPIRED), không thể thay đổi trạng thái!");
        }

        // 3. MÁY TRẠNG THÁI (STATE MACHINE) - Kiểm soát chặt luồng đi
        switch (newStatus) {
            case "WAITING_APPROVAL":
                // Nhân viên gửi từ DRAFT hoặc sau khi bị REJECTED
                if (!"DRAFT".equals(currentStatus) && !"REJECTED".equals(currentStatus)) {
                    throw new RuntimeException("Chỉ báo giá DRAFT hoặc bị REJECTED mới được gửi duyệt!");
                }
                break;
            case "APPROVED":
            case "REJECTED":
                // Giám đốc duyệt/từ chối từ trạng thái đang chờ
                if (!"WAITING_APPROVAL".equals(currentStatus)) {
                    throw new RuntimeException("Chỉ có thể Duyệt/Từ chối báo giá đang ở trạng thái WAITING_APPROVAL!");
                }
                // Nếu REJECTED, nạp lý do
                if ("REJECTED".equals(newStatus)) {
                    quotation.setRejectionReason(reason);
                } else {
                    quotation.setRejectionReason(null); // Clear reason if approved
                }
                if(note != null && !note.trim().isEmpty()) {
                    quotation.setApprovalNote(note.trim());
                }
                break;
            case "ACCEPTED":
            case "CANCELLED":
                // Chỉ khi đã được duyệt mới được chốt/hủy với khách
                if (!"APPROVED".equals(currentStatus)) {
                    throw new RuntimeException("Báo giá phải ở trạng thái APPROVED mới được chuyển sang ACCEPTED/CANCELLED!");
                }
                break;
            case "DRAFT":
                // Quay về DRAFT để sửa nếu bị từ chối
                if (!"REJECTED".equals(currentStatus)) {
                    throw new RuntimeException("Chỉ khi bị REJECTED mới có thể đưa về DRAFT để chỉnh sửa!");
                }
                break;
        }

        // 4. Cập nhật và lưu DB
        quotation.setStatus(newStatus);
        Quotation savedQuotation = quotationRepository.save(quotation);

        // 5. SEND NOTIFICATIONS
        if (newStatus.equals("WAITING_APPROVAL")) {
            List<User> directors = userRepository.findActiveUsersByRoleNames(List.of("DIRECTOR", "ROLE_DIRECTOR"));
            for (User d : directors) {
                Notification n = new Notification();
                n.setUser(d);
                n.setTitle("Yêu cầu duyệt báo giá");
                n.setMessage("Báo giá " + savedQuotation.getQuotationNumber() + " đang chờ bạn duyệt.");
                n.setReferenceId(savedQuotation.getId());
                n.setType("APPROVAL_REQUEST");
                notificationRepository.save(n);
            }
        } else if (newStatus.equals("APPROVED")) {
            User u = savedQuotation.getStaff().getUser();
            if (u != null) {
                Notification n = new Notification();
                n.setUser(u);
                n.setTitle("Báo giá đã được duyệt");
                n.setMessage("Báo giá " + savedQuotation.getQuotationNumber() + " đã được Giám đốc phê duyệt.");
                n.setReferenceId(savedQuotation.getId());
                n.setType("APPROVED");
                notificationRepository.save(n);
            }
        } else if (newStatus.equals("REJECTED")) {
            User u = savedQuotation.getStaff().getUser();
            if (u != null) {
                Notification n = new Notification();
                n.setUser(u);
                n.setTitle("Báo giá bị từ chối");
                String msg = "Báo giá " + savedQuotation.getQuotationNumber() + " đã bị từ chối.";
                if (reason != null && !reason.trim().isEmpty()) {
                    msg += " Lý do: " + reason.trim();
                }
                n.setMessage(msg);
                n.setReferenceId(savedQuotation.getId());
                n.setType("REJECTED");
                notificationRepository.save(n);
            }
        }

        return savedQuotation;
    }


    // 👉 API SỬA NỘI DUNG BÁO GIÁ
    @Transactional
    public Quotation updateQuotation(Long id, QuotationRequest request) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Báo giá ID " + id));

        // 1. Chặn đứng nếu Báo giá đã Chốt hoặc Từ chối
        if (!"DRAFT".equals(quotation.getStatus()) && !"REJECTED".equals(quotation.getStatus())) {
            throw new RuntimeException("Lỗi: Chỉ có thể sửa nội dung báo giá khi đang là Nháp (DRAFT) hoặc bị Giám đốc Từ chối (REJECTED)!");
        }

        // 2. Cập nhật thông tin chung
        quotation.setNote(request.getNote());
        
        // 2.1 Validate chiết khấu tổng (Max 30%)
        BigDecimal discountPercent = request.getDiscountPercent() != null ? request.getDiscountPercent() : BigDecimal.ZERO;
        if (discountPercent.compareTo(new BigDecimal("30")) > 0) {
            throw new RuntimeException("Lỗi: Chiết khấu không được vượt quá 30% giá trị đơn hàng!");
        }
        quotation.setDiscountPercent(discountPercent);

        // 3. Làm sạch chi tiết cũ
        quotation.getDetails().clear();
        quotationRepository.flush();

        BigDecimal subTotal = BigDecimal.ZERO;

        // 4. Vòng lặp nạp lại chi tiết
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (QuotationRequest.QuotationDetailRequest itemReq : request.getItems()) {
                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Sản phẩm ID " + itemReq.getProductId()));

                QuotationDetail detail = new QuotationDetail();
                detail.setProduct(product);
                detail.setQuantity(itemReq.getQuantity());
                detail.setUnitPrice(itemReq.getUnitPrice());

                BigDecimal quantityBD = new BigDecimal(itemReq.getQuantity());
                BigDecimal lineAmount = quantityBD.multiply(itemReq.getUnitPrice());
                detail.setTotalLineAmount(lineAmount);
                detail.setDiscount(BigDecimal.ZERO);

                subTotal = subTotal.add(lineAmount);
                quotation.addDetail(detail);
            }
        } else {
            throw new RuntimeException("Lỗi: Báo giá cập nhật phải có ít nhất 1 sản phẩm!");
        }

        // 5. Chốt tổng tiền mới sau chiết khấu
        BigDecimal discountMultiplier = BigDecimal.valueOf(100).subtract(discountPercent).divide(BigDecimal.valueOf(100));
        BigDecimal grandTotal = subTotal.multiply(discountMultiplier);
        
        quotation.setTotalAmount(grandTotal);

        // 6. Tự động chuyển sang WAITING_APPROVAL sau khi sửa (nêu đang là DRAFT hoặc REJECTED)
        quotation.setStatus("WAITING_APPROVAL");
        quotation.setRejectionReason(null); // Xóa lý do cũ nếu có

        Quotation saved = quotationRepository.save(quotation);

        // 7. Gửi thông báo cho Giám đốc
        List<User> directors = userRepository.findActiveUsersByRoleNames(List.of("DIRECTOR", "ROLE_DIRECTOR"));
        for (User d : directors) {
            Notification n = new Notification();
            n.setUser(d);
            n.setTitle("Báo giá đã được cập nhật/gửi lại");
            n.setMessage("Báo giá " + saved.getQuotationNumber() + " đã được nhân viên chỉnh sửa và gửi lại.");
            n.setReferenceId(saved.getId());
            n.setType("APPROVAL_REQUEST");
            notificationRepository.save(n);
        }

        return quotationRepository.findById(saved.getId())
                .orElseThrow(() -> new RuntimeException("Lỗi khi tải lại báo giá"));
    }

    //API LẤY DANH SÁCH BÁO GIÁ
    public Page<QuotationListResponse> getAllQuotations(String keyword, String status, Long customerId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        // Nếu user truyền chuỗi rỗng "", chuyển thành null để DB bỏ qua điều kiện lọc
        String validKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String validStatus = (status != null && !status.trim().isEmpty()) ? status.trim().toUpperCase() : null;

        Page<Quotation> quotationPage = quotationRepository.searchQuotations(validKeyword, validStatus, customerId, startDate, endDate, pageable);

        // Map nguyên mảng Entity sang DTO siêu nhẹ
        return quotationPage.map(QuotationListResponse::new);
    }

    // API XEM CHI TIẾT CỦA 1 BÁO GIÁ
    public QuotationDetailResponse getQuotationDetail(Long id) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Báo giá ID " + id));

        return new QuotationDetailResponse(quotation);
    }
}