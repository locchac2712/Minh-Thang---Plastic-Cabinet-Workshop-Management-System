package com.tuplastic.erp.order.service;

import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.entity.OrderItem;
import com.tuplastic.erp.product.entity.Product;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

/**
 * Chỉ số phê duyệt giá cho Giám đốc — ước tính từ giá vốn SP hiện tại (giống lúc approve).
 */
public final class DirectorApprovalMetricsCalculator {

    private static final BigDecimal DEEP_DISCOUNT_MIN_VND = new BigDecimal("500000");
    private static final BigDecimal DEEP_DISCOUNT_RATE = new BigDecimal("0.03");
    private static final int APPROVAL_SLA_DAYS = 2;

    private DirectorApprovalMetricsCalculator() {
    }

    public static BigDecimal computeMarginPercent(Order order) {
        BigDecimal revenue = order.getTotalPayable();
        if (revenue == null || revenue.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        BigDecimal cost = BigDecimal.ZERO;
        for (OrderItem item : order.getItems()) {
            BigDecimal unitCost = resolveUnitCost(item);
            if (unitCost != null) {
                cost = cost.add(unitCost.multiply(BigDecimal.valueOf(item.getQuantity())));
            }
        }
        BigDecimal margin = revenue.subtract(cost);
        return margin.multiply(BigDecimal.valueOf(100))
                .divide(revenue, 1, RoundingMode.HALF_UP);
    }

    public static BigDecimal floorMarginPercent(Order order) {
        if (order.getItems().stream().anyMatch(DirectorApprovalMetricsCalculator::isCustomItem)) {
            return BigDecimal.valueOf(18);
        }
        BigDecimal total = nullToZero(order.getTotalAmount());
        BigDecimal discount = nullToZero(order.getDiscountAmount());
        BigDecimal threshold = DEEP_DISCOUNT_MIN_VND.max(total.multiply(DEEP_DISCOUNT_RATE));
        if (total.compareTo(BigDecimal.ZERO) > 0 && discount.compareTo(threshold) >= 0) {
            return BigDecimal.valueOf(16);
        }
        return BigDecimal.valueOf(15);
    }

    public static LocalDate approvalSlaDueAt(Order order) {
        if (order.getCreatedAt() == null) {
            return null;
        }
        return order.getCreatedAt().toLocalDate().plusDays(APPROVAL_SLA_DAYS);
    }

    public static BigDecimal resolveUnitCost(OrderItem item) {
        if (item.getUnitCostAtTime() != null) {
            return item.getUnitCostAtTime();
        }
        Product product = item.getProduct();
        return product != null ? product.getCostPrice() : null;
    }

    private static boolean isCustomItem(OrderItem item) {
        Product product = item.getProduct();
        return product != null && Boolean.TRUE.equals(product.getIsCustom());
    }

    private static BigDecimal nullToZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
