package com.pcwms.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MaterialRequirementResponse {
    private Long materialId;
    private String materialName;
    private String unit;
    private BigDecimal totalQuantity;
}
