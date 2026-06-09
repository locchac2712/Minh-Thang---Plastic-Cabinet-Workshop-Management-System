package com.tuplastic.erp.order.service;

import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.entity.OrderItem;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.product.entity.Product;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DirectorApprovalMetricsCalculatorTest {

    @Test
    void computeMarginPercent_usesProductCostWhenUnitCostAtTimeMissing() {
        Order order = orderWithItem(
                BigDecimal.valueOf(100_000_000),
                BigDecimal.valueOf(5_000_000),
                BigDecimal.valueOf(95_000_000),
                product(false, BigDecimal.valueOf(800_000)),
                100,
                BigDecimal.valueOf(1_000_000),
                null);

        BigDecimal margin = DirectorApprovalMetricsCalculator.computeMarginPercent(order);

        // cost 80M, revenue 95M → margin 15.8%
        assertThat(margin).isEqualByComparingTo(BigDecimal.valueOf(15.8));
    }

    @Test
    void floorMarginPercent_customOrderUses18() {
        Order order = orderWithItem(
                BigDecimal.TEN,
                BigDecimal.ZERO,
                BigDecimal.TEN,
                product(true, BigDecimal.ONE),
                1,
                BigDecimal.TEN,
                null);

        assertThat(DirectorApprovalMetricsCalculator.floorMarginPercent(order))
                .isEqualByComparingTo(BigDecimal.valueOf(18));
    }

    @Test
    void floorMarginPercent_deepDiscountUses16() {
        Order order = orderWithItem(
                BigDecimal.valueOf(10_000_000),
                BigDecimal.valueOf(500_000),
                BigDecimal.valueOf(9_500_000),
                product(false, BigDecimal.valueOf(7_000_000)),
                1,
                BigDecimal.valueOf(10_000_000),
                null);

        assertThat(DirectorApprovalMetricsCalculator.floorMarginPercent(order))
                .isEqualByComparingTo(BigDecimal.valueOf(16));
    }

    @Test
    void approvalSlaDueAt_isTwoDaysAfterCreatedAt() {
        Order order = Order.builder()
                .status(OrderStatus.Pending)
                .createdAt(LocalDateTime.of(2026, 4, 19, 9, 0))
                .build();

        assertThat(DirectorApprovalMetricsCalculator.approvalSlaDueAt(order))
                .isEqualTo(LocalDate.of(2026, 4, 21));
    }

    private static Order orderWithItem(BigDecimal totalAmount,
                                       BigDecimal discountAmount,
                                       BigDecimal totalPayable,
                                       Product product,
                                       int quantity,
                                       BigDecimal unitPrice,
                                       BigDecimal unitCostAtTime) {
        OrderItem item = OrderItem.builder()
                .product(product)
                .quantity(quantity)
                .unitPrice(unitPrice)
                .unitCostAtTime(unitCostAtTime)
                .subtotal(unitPrice.multiply(BigDecimal.valueOf(quantity)))
                .build();
        return Order.builder()
                .status(OrderStatus.Pending)
                .totalAmount(totalAmount)
                .discountAmount(discountAmount)
                .totalPayable(totalPayable)
                .items(List.of(item))
                .build();
    }

    private static Product product(boolean custom, BigDecimal costPrice) {
        return Product.builder()
                .isCustom(custom)
                .costPrice(costPrice)
                .build();
    }
}
