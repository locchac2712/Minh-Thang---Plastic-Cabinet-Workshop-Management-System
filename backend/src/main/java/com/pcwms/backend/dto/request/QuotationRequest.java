package com.pcwms.backend.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuotationRequest {

    private Long customerId;
    private Long staffId; // Nhân viên tạo báo giá
    private LocalDateTime validUntil; // Hạn chót
    private String note; // Ghi chú báo giá

    // Danh sách các dòng sản phẩm trong báo giá
    private List<QuotationDetailRequest> items;

    @Data
    public static class QuotationDetailRequest {
        private Long productId;
        private Integer quantity;
        private BigDecimal unitPrice;
        private Double discountPercent; // Nhận % chiết khấu từ giao diện Frontend
    }
}