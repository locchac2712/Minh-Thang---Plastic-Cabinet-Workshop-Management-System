package com.tuplastic.erp.bom.dto;

import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateBomItemRequest {

    @Positive(message = "Số lượng định mức phải lớn hơn 0")
    private BigDecimal quantity;

    private String note;
}
