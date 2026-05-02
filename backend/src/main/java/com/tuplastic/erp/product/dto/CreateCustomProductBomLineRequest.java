package com.tuplastic.erp.product.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateCustomProductBomLineRequest {

    @NotNull(message = "Vật tư không được để trống")
    private UUID materialId;

    @NotNull(message = "Định mức không được để trống")
    private BigDecimal quantity;

    private String note;
}
