package com.tuplastic.erp.reconcile;

/**
 * Tiêu chí dư nợ tính từ đơn — đồng bộ {@link AgencyDebtComputationService} và {@code ReceivableWarningsService}.
 * Chỉ đơn fulfillment (DH, {@code source_order_id NOT NULL}), trạng thái vận hành; loại báo giá BG.
 */
public final class AgencyOpenDebtCriteria {

    /** Fragment WHERE (alias {@code o}) cho native SQL. */
    public static final String OPEN_FULFILLMENT_WHERE = """
            o.source_order_id IS NOT NULL
              AND o.status IN ('Approved', 'Producing', 'Done')
            """;

    public static final String REMAINING_EXPR = "GREATEST(o.total_payable - o.paid_amount, 0)";

    private AgencyOpenDebtCriteria() {
    }
}
