package com.tuplastic.erp.production.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateProductionBatchRequest {

    @NotNull(message = "Mã dòng đơn không được để trống")
    private UUID orderItemId;

    @NotNull(message = "Số lượng lô không được để trống")
    @Min(value = 1, message = "Số lượng lô phải >= 1")
    private Integer quantity;

    @NotNull(message = "Hạn lô không được để trống")
    private LocalDate expectedEndDate;
}
