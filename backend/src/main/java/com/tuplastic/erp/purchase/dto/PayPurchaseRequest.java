package com.tuplastic.erp.purchase.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PayPurchaseRequest {

    @NotNull(message = "Số tiền thanh toán không được để trống")
    @DecimalMin(value = "0.0001", message = "Số tiền thanh toán phải lớn hơn 0")
    private BigDecimal paidAmount;
}
