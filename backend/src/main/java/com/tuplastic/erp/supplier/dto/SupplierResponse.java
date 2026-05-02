package com.tuplastic.erp.supplier.dto;

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
public class SupplierResponse {

    private UUID id;
    private String name;
    private String phone;
    private String address;
    private String taxCode;
    private BigDecimal totalDebt;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
