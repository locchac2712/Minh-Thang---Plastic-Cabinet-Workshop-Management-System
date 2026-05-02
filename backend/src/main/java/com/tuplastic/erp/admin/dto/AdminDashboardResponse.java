package com.tuplastic.erp.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {

    private Map<String, Long> userCountByRole;
    private long totalAgencyCount;
    private long activeAgencyCount;
    private long activeProductCount;
    private long materialLowStockCount;
    private long supplierWithPositiveDebtCount;
    private List<RecentAgencyItem> recentAgencies;
}
