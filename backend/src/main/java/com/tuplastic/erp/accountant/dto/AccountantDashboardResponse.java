package com.tuplastic.erp.accountant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountantDashboardResponse {

    private long pendingPaymentCount;
    private long draftInvoiceCount;
    private long purchaseOrdersPendingReceiveCount;
    private long purchaseOrdersWithOpenPaymentCount;
    private long lowStockMaterialCount;
}
