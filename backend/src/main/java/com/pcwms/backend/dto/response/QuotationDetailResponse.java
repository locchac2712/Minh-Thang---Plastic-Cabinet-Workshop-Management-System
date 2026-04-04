package com.pcwms.backend.dto.response;

import com.pcwms.backend.entity.Quotation;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
public class QuotationDetailResponse {
    private Long id;
    private String quotationNumber;
    private CustomerDto customer;
    private StaffDto staff;
    private BigDecimal totalAmount;
    private String status;
    private String note;

    // 👉 THÊM TRƯỜNG NÀY: Lời nhắn của Giám đốc
    private String approvalNote;

    private LocalDateTime createdDate;
    private LocalDateTime validUntil;
    private List<ItemDto> details;

    // Ép kiểu từ Entity sang DTO ngay trong Constructor
    public QuotationDetailResponse(Quotation q) {
        this.id = q.getId();
        this.quotationNumber = q.getQuotationNumber();
        this.totalAmount = q.getTotalAmount();
        this.status = q.getStatus();
        this.note = q.getNote();

        // 👉 MAP DATA: Lấy note của Giám đốc từ Entity
        this.approvalNote = q.getApprovalNote();

        this.createdDate = q.getCreatedDate();
        this.validUntil = q.getValidUntil();

        // Lọc thông tin Khách hàng (Bỏ bớt nợ nần, mã số thuế nếu không cần thiết hiển thị ở BG)
        this.customer = new CustomerDto(q.getCustomer().getId(), q.getCustomer().getName(), q.getCustomer().getEmail(), q.getCustomer().getPhoneNumber(), q.getCustomer().getAddress());

        // Lọc thông tin Sales (Cực sạch, không dính dáng đến User/Password)
        this.staff = new StaffDto(q.getStaff().getId(), q.getStaff().getFullname(), q.getStaff().getEmployeeId());

        // Lọc mảng Sản phẩm chi tiết
        this.details = q.getDetails().stream().map(d -> new ItemDto(
                d.getId(),
                d.getProduct().getId(),
                d.getProduct().getName(),
                d.getProduct().getSku(),
                d.getQuantity(),
                d.getUnitPrice(),
                d.getDiscount(),
                d.getTotalLineAmount()
        )).collect(Collectors.toList());
    }

    // ================= CLASS NỘI BỘ (Để nhét dữ liệu gọn gàng) =================
    @Getter @Setter
    public static class CustomerDto {
        private Long id; private String name; private String email; private String phone; private String address;
        public CustomerDto(Long id, String name, String email, String phone, String address) { this.id = id; this.name = name; this.email = email; this.phone = phone; this.address = address; }
    }

    @Getter @Setter
    public static class StaffDto {
        private Long id; private String fullname; private String employeeId;
        public StaffDto(Long id, String fullname, String employeeId) { this.id = id; this.fullname = fullname; this.employeeId = employeeId; }
    }

    @Getter @Setter
    public static class ItemDto {
        private Long id; private Long productId; private String productName; private String productSku;
        private Integer quantity; private BigDecimal unitPrice; private BigDecimal discount; private BigDecimal totalLineAmount;
        public ItemDto(Long id, Long productId, String productName, String productSku, Integer quantity, BigDecimal unitPrice, BigDecimal discount, BigDecimal totalLineAmount) {
            this.id = id; this.productId = productId; this.productName = productName; this.productSku = productSku;
            this.quantity = quantity; this.unitPrice = unitPrice; this.discount = discount; this.totalLineAmount = totalLineAmount;
        }
    }
}