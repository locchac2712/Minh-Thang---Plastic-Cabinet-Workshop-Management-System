package com.tuplastic.erp.director.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupplierDebtReportItem {

    private UUID id;
    private String name;
    private BigDecimal totalDebt;
    private Boolean isActive;
}
