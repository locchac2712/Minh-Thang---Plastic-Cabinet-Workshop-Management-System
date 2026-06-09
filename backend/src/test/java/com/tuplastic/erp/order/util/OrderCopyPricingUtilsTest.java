package com.tuplastic.erp.order.util;

import com.tuplastic.erp.order.dto.CreateOrderItemRequest;
import com.tuplastic.erp.order.dto.CreateOrderRequest;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.entity.OrderItem;
import com.tuplastic.erp.product.entity.Product;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OrderCopyPricingUtilsTest {

    private static final UUID PRODUCT_A = UUID.randomUUID();
    private static final UUID PRODUCT_B = UUID.randomUUID();
    private static final UUID PRODUCT_C = UUID.randomUUID();

    @Test
    void alignedWhenOnlyQuantityDiffers() {
        Order source = sourceOrder(
                BigDecimal.valueOf(50_000),
                BigDecimal.valueOf(10_000),
                line(PRODUCT_A, BigDecimal.valueOf(100), 10),
                line(PRODUCT_B, BigDecimal.valueOf(200), 5));

        CreateOrderRequest request = request(
                BigDecimal.valueOf(50_000),
                BigDecimal.valueOf(10_000),
                item(PRODUCT_A, 3, BigDecimal.valueOf(100)),
                item(PRODUCT_B, 1, BigDecimal.valueOf(200)));

        assertTrue(OrderCopyPricingUtils.isPricingAlignedWithSource(source, request));
    }

    @Test
    void alignedWhenSubsetOfSourceLines() {
        Order source = sourceOrder(
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                line(PRODUCT_A, BigDecimal.valueOf(100), 10),
                line(PRODUCT_B, BigDecimal.valueOf(200), 5));

        CreateOrderRequest request = request(
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                item(PRODUCT_A, 2, BigDecimal.valueOf(100)));

        assertTrue(OrderCopyPricingUtils.isPricingAlignedWithSource(source, request));
    }

    @Test
    void notAlignedWhenUnitPriceDiffers() {
        Order source = sourceOrder(
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                line(PRODUCT_A, BigDecimal.valueOf(100), 10));

        CreateOrderRequest request = request(
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                item(PRODUCT_A, 10, BigDecimal.valueOf(99)));

        assertFalse(OrderCopyPricingUtils.isPricingAlignedWithSource(source, request));
    }

    @Test
    void notAlignedWhenNewProductAdded() {
        Order source = sourceOrder(
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                line(PRODUCT_A, BigDecimal.valueOf(100), 10));

        CreateOrderRequest request = request(
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                item(PRODUCT_A, 10, BigDecimal.valueOf(100)),
                item(PRODUCT_C, 1, BigDecimal.valueOf(50)));

        assertFalse(OrderCopyPricingUtils.isPricingAlignedWithSource(source, request));
    }

    @Test
    void alignedWhenOnlyDiscountDiffers() {
        Order source = sourceOrder(
                BigDecimal.valueOf(10_000),
                BigDecimal.ZERO,
                line(PRODUCT_A, BigDecimal.valueOf(100), 10));

        CreateOrderRequest request = request(
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                item(PRODUCT_A, 10, BigDecimal.valueOf(100)));

        assertTrue(OrderCopyPricingUtils.isPricingAlignedWithSource(source, request));
    }

    @Test
    void alignedWhenOnlyShippingDiffers() {
        Order source = sourceOrder(
                BigDecimal.ZERO,
                BigDecimal.valueOf(5_000),
                line(PRODUCT_A, BigDecimal.valueOf(100), 10));

        CreateOrderRequest request = request(
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                item(PRODUCT_A, 10, BigDecimal.valueOf(100)));

        assertTrue(OrderCopyPricingUtils.isPricingAlignedWithSource(source, request));
    }

    private static Order sourceOrder(BigDecimal discount, BigDecimal shipping, OrderItem... items) {
        Order order = Order.builder()
                .discountAmount(discount)
                .shippingFee(shipping)
                .build();
        for (OrderItem item : items) {
            item.setOrder(order);
            order.getItems().add(item);
        }
        return order;
    }

    private static OrderItem line(UUID productId, BigDecimal unitPrice, int qty) {
        Product product = Product.builder().name("P").sku("SKU").build();
        product.setId(productId);
        return OrderItem.builder()
                .product(product)
                .unitPrice(unitPrice)
                .quantity(qty)
                .build();
    }

    private static CreateOrderRequest request(
            BigDecimal discount,
            BigDecimal shipping,
            CreateOrderItemRequest... items) {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setDiscountAmount(discount);
        request.setShippingFee(shipping);
        request.setItems(List.of(items));
        return request;
    }

    private static CreateOrderItemRequest item(UUID productId, int qty, BigDecimal unitPrice) {
        CreateOrderItemRequest item = new CreateOrderItemRequest();
        item.setProductId(productId);
        item.setQuantity(qty);
        item.setUnitPrice(unitPrice);
        return item;
    }
}
