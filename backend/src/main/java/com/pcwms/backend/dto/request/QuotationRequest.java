package com.pcwms.backend.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class QuotationRequest {

    private Long customerId;
    private Long staffId; // Nhân viên tạo báo giá
    private BigDecimal discountPercent; // Chiết khấu tổng đơn hàng (%)
    private String note; // Ghi chú báo giá

    // Danh sách các dòng sản phẩm trong báo giá
    private List<QuotationDetailRequest> items;

    @Data
    public static class QuotationDetailRequest {
        private Long productId;
        private Integer quantity;
        private BigDecimal unitPrice;
    }
}