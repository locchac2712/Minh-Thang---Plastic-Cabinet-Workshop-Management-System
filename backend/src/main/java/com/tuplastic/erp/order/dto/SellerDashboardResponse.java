package com.tuplastic.erp.order.dto;

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
public class SellerDashboardResponse {

    private Map<String, Long> orderCountByStatus;
    private List<AgencyDebtRiskItem> agenciesNearingDebtLimit;
    private List<OrderResponse> recentOrders;
}
