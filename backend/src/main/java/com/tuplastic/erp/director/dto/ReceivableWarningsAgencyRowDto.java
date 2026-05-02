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
public class ReceivableWarningsAgencyRowDto {

    private UUID agencyId;
    private String name;
    private String legalCompanyName;
    private String address;
    private String taxCode;

    private UUID assignedSellerId;
    private String assignedSellerName;

    private BigDecimal totalDebt;
    private BigDecimal maxDebtLimit;
    private BigDecimal utilizationPercent;

    /** Ước tính phần đơn Done còn dư thu đã quá due theo quy ước. */
    private BigDecimal estimatedOverdueAmount;

    /** Bucket xấu nhất còn tiền (dùng filter). */
    private String primaryAgingBucket;

    private Integer maxOverdueDays;

    /** SERIOUS | HIGH | MONITOR */
    private String riskBand;

    private Boolean isActive;
}
