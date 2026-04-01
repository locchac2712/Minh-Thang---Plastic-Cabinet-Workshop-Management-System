package com.pcwms.backend.dto.response;

import com.pcwms.backend.entity.SalesOrder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
public class SalesOrderDetailResponse {
    private Long id;
    private String orderNumber;

    // Nối ngược về gốc (Biết Đơn này đẻ ra từ Báo giá nào)
    private Long quotationId;
    private String quotationNumber;

    private CustomerDto customer;
    private BigDecimal totalAmount;
    private String status;
    private String paymentStatus;
    private LocalDateTime createdDate;
    private List<ItemDto> details;
    private Integer priorityLevel;
    private LocalDate dueDate;// Thêm trường này để ưu tiên hiển thị đơn hàng nào trước sau

    public SalesOrderDetailResponse(SalesOrder order) {
        this.id = order.getId();
        this.orderNumber = order.getOrderNumber();
        this.totalAmount = order.getTotalAmount();
        this.status = order.getStatus();
        this.paymentStatus = order.getPaymentStatus();
        this.createdDate = order.getCreatedDate();
        this.priorityLevel = order.getPriorityLevel();
        this.dueDate = order.getDueDate();

        // Trace back về Báo giá (Nếu có)
        if (order.getQuotation() != null) {
            this.quotationId = order.getQuotation().getId();
            this.quotationNumber = order.getQuotation().getQuotationNumber();
        }

        // Thông tin khách
        if (order.getCustomer() != null) {
            this.customer = new CustomerDto(
                    order.getCustomer().getId(),
                    order.getCustomer().getName(),
                    order.getCustomer().getEmail(),
                    order.getCustomer().getPhoneNumber(),
                    order.getCustomer().getAddress(),
                    order.getCustomer().getCreditLimit(),   // ← thêm
                    order.getCustomer().getCurrentDebt()    // ← thêm
            );
        }

        // Mảng sản phẩm chi tiết
        if (order.getDetails() != null) {
            this.details = order.getDetails().stream().map(d -> new ItemDto(
                    d.getId(),
                    d.getProduct().getId(),
                    d.getProduct().getName(),
                    d.getProduct().getSku(),
                    d.getQuantity(),
                    d.getUnitPrice(),
                    d.getDiscount(),
                    d.getTotalLineAmount() // Gọi thẳng hàm nãy anh em mình viết trong Entity
            )).collect(Collectors.toList());
        }
    }

    // ================= CLASS NỘI BỘ (Để nhét dữ liệu gọn gàng) =================
    @Getter @Setter
    public static class CustomerDto {
        private Long       id;
        private String     name;
        private String     email;
        private String     phone;
        private String     address;
        private BigDecimal creditLimit;   // hạn mức tín dụng
        private BigDecimal currentDebt;   // công nợ hiện tại

        public CustomerDto(Long id, String name, String email, String phone,
                           String address, BigDecimal creditLimit, BigDecimal currentDebt) {
            this.id          = id;
            this.name        = name;
            this.email       = email;
            this.phone       = phone;
            this.address     = address;
            this.creditLimit = creditLimit;
            this.currentDebt = currentDebt;
        }
    }

    @Getter @Setter
    public static class ItemDto {
        private Long       id;
        private Long       productId;
        private String     productName;
        private String     productSku;
        private Integer    quantity;
        private BigDecimal unitPrice;
        private BigDecimal discount;
        private BigDecimal totalLineAmount;

        public ItemDto(Long id, Long productId, String productName, String productSku,
                       Integer quantity, BigDecimal unitPrice,
                       BigDecimal discount, BigDecimal totalLineAmount) {
            this.id              = id;
            this.productId       = productId;
            this.productName     = productName;
            this.productSku      = productSku;
            this.quantity        = quantity;
            this.unitPrice       = unitPrice;
            this.discount        = discount;
            this.totalLineAmount = totalLineAmount;
        }
    }
}