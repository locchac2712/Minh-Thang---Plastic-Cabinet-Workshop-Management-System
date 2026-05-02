package com.tuplastic.erp.agency.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgencyResponse {

    private UUID id;
    private String name;
    private UUID assignedSellerId;
    private String assignedSellerName;
    private String level;
    private String phone;
    private String address;
    private String taxCode;
    private String legalCompanyName;
    private BigDecimal totalDebt;
    private BigDecimal maxDebtLimit;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
