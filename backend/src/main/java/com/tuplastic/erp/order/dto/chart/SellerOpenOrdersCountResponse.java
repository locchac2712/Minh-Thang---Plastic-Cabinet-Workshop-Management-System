package com.tuplastic.erp.order.dto.chart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Snapshot đơn fulfillment đang mở của seller — khớp tab Chờ sản xuất + Sản xuất trên FE.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerOpenOrdersCountResponse {

    /** Tổng {@code approvedCount + producingCount}. */
    private long count;

    private long approvedCount;

    private long producingCount;
}
