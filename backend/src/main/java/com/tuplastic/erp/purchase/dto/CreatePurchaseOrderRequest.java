package com.tuplastic.erp.purchase.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class CreatePurchaseOrderRequest {

    @NotNull(message = "Mã nhà cung cấp không được để trống")
    private UUID supplierId;

    @NotNull(message = "Tổng tiền không được để trống")
    @DecimalMin(value = "0", inclusive = true, message = "Tổng tiền không được âm")
    private BigDecimal totalAmount;

    @NotEmpty(message = "Phải có ít nhất một dòng hàng")
    @Valid
    private List<CreatePurchaseLineRequest> items;
}
