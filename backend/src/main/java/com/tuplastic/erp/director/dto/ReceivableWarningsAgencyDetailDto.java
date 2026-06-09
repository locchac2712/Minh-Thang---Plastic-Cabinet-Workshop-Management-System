package com.tuplastic.erp.director.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceivableWarningsAgencyDetailDto {

    private UUID agencyId;
    private String name;
    private String legalCompanyName;
    private String address;
    private String taxCode;
    private UUID assignedSellerId;
    private String assignedSellerName;

    private BigDecimal totalDebtRecorded;
    private BigDecimal computedDebtFromOrders;
    private BigDecimal debtReconciliationDelta;
    private BigDecimal maxDebtLimit;
    private BigDecimal utilizationPercent;
    private String riskBand;

    private LocalDate oldestAnchorDateAmongOrders;
    /** estimatedOverdueFromOrders / totalDebtRecorded nếu totalDebt > 0. */
    private BigDecimal overdueRatioVsRecordedDebt;

    /** Buckets: CURRENT, DAYS_1_30, DAYS_31_60, DAYS_61_90, DAYS_OVER_90 → số tiền. */
    private Map<String, BigDecimal> agingBuckets;

    /** Cùng buckets nhưng phần trăm trên tổng dư các đơn trong agency (sum remaining). */
    private Map<String, BigDecimal> agingBucketPercents;

    private Integer maxOverdueDays;
    private List<ReceivableContributingOrderDto> contributingOrders;
}
