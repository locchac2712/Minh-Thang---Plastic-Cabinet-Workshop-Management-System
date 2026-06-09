package com.tuplastic.erp.order.util;

import com.tuplastic.erp.order.enums.OrderStatus;

import java.util.EnumSet;
import java.util.Set;

public final class OrderPhaseUtils {

    private static final Set<OrderStatus> QUOTATION_PHASE = EnumSet.of(
            OrderStatus.Draft,
            OrderStatus.Pending,
            OrderStatus.Rejected,
            OrderStatus.Canceled);

    private static final Set<OrderStatus> OPERATIONS_PHASE = EnumSet.of(
            OrderStatus.Approved,
            OrderStatus.Producing,
            OrderStatus.Done);

    /** Trạng thái đơn/báo giá gốc được phép copy sang đơn mới (UI + BE). */
    private static final Set<OrderStatus> COPY_SOURCE_STATUSES = EnumSet.of(
            OrderStatus.Approved,
            OrderStatus.Producing,
            OrderStatus.Done,
            OrderStatus.Canceled);

    private OrderPhaseUtils() {
    }

    public static boolean canCopyFromOrderStatus(OrderStatus status) {
        return status != null && COPY_SOURCE_STATUSES.contains(status);
    }

    public static boolean isQuotationPhase(OrderStatus status) {
        return status != null && QUOTATION_PHASE.contains(status);
    }

    public static boolean isOperationsPhase(OrderStatus status) {
        return status != null && OPERATIONS_PHASE.contains(status);
    }
}
