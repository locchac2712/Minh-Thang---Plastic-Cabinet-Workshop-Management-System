package com.tuplastic.erp.production.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ManualInventoryRequest {

    private UUID taskId;

    @NotNull(message = "Mã vật tư không được để trống")
    private UUID materialId;

    @NotNull(message = "Số lượng không được để trống")
    private BigDecimal quantityChange;

    private String note;
}
