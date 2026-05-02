package com.tuplastic.erp.bom.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateBomItemRequest {

    @NotNull(message = "Mã vật tư không được để trống")
    private UUID materialId;

    @NotNull(message = "Số lượng định mức không được để trống")
    @Positive(message = "Số lượng định mức phải lớn hơn 0")
    private BigDecimal quantity;

    private String note;
}
