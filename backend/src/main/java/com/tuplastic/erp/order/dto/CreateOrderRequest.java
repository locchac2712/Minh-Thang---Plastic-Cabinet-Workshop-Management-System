package com.tuplastic.erp.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class CreateOrderRequest {

    @NotNull(message = "Mã đại lý không được để trống")
    private UUID agencyId;

    private BigDecimal discountAmount;

    private BigDecimal shippingFee;

    private String shippingAddress;

    private String note;

    /** Hạn hiệu lực báo giá; null = không giới hạn. */
    private LocalDate quotationValidUntil;

    /** Đơn/báo giá gốc khi tạo từ copy (optional). */
    private UUID sourceOrderId;

    @NotEmpty(message = "Đơn hàng phải có ít nhất 1 sản phẩm")
    @Valid
    private List<CreateOrderItemRequest> items;
}
