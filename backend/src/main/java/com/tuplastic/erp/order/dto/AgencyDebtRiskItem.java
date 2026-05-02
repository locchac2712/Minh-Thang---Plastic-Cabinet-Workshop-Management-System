package com.tuplastic.erp.order.dto;

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
public class AgencyDebtRiskItem {

    private UUID id;
    private String name;
    private BigDecimal totalDebt;
    private BigDecimal maxDebtLimit;
}
