package com.tuplastic.erp.director.dto;

import com.tuplastic.erp.reconcile.DebtReconciliationService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectorDashboardResponse {

    private List<RevenueReportItem> revenueByPeriod;
    private GrossMarginReport grossMargin;
    private long pendingOrderCount;
    private DebtReconciliationService.DebtSanitySnapshot debtSanity;
}
