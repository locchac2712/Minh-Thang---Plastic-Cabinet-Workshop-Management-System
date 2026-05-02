package com.tuplastic.erp.accountant.dto.chart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashFlowTrendPoint {
    private LocalDate bucket;
    /** Tiền vào (payments Completed) */
    private BigDecimal inflow;
    /** Tiền ra (purchase_orders.paid_amount delta — ước lượng theo updated_at) */
    private BigDecimal outflow;
    private BigDecimal net;
}
