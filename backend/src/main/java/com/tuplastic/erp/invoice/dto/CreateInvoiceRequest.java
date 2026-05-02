package com.tuplastic.erp.invoice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateInvoiceRequest {

    @NotNull(message = "Mã đơn hàng không được để trống")
    private UUID orderId;

    @NotNull(message = "Thuế suất VAT không được để trống")
    private BigDecimal vatRate;
}
