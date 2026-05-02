package com.tuplastic.erp.agency.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class OverrideDebtRequest {

    @NotNull(message = "Hạn mức công nợ mới không được để trống")
    @DecimalMin(value = "0", message = "Hạn mức công nợ không được âm")
    private BigDecimal maxDebtLimit;
}
