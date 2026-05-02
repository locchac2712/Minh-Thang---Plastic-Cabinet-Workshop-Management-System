package com.tuplastic.erp.purchase.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreatePurchaseLineRequest {

    @NotNull(message = "Mã vật tư không được để trống")
    private UUID materialId;

    @NotNull(message = "Số lượng không được để trống")
    @DecimalMin(value = "0.0001", message = "Số lượng phải lớn hơn 0")
    private BigDecimal quantity;

    @NotNull(message = "Đơn giá không được để trống")
    @DecimalMin(value = "0", inclusive = true, message = "Đơn giá không được âm")
    private BigDecimal unitPrice;
}
