package com.tuplastic.erp.director.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectorWasteMaterialRow {

    private UUID materialId;
    private String materialCode;
    private String materialName;
    private BigDecimal quantityAbs;
    private BigDecimal damageVnd;
}
