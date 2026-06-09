package com.tuplastic.erp.order.service;

import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.entity.OrderItem;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderFulfillmentCalculatorTest {

    @Mock
    private ProductionTaskRepository productionTaskRepository;

    @InjectMocks
    private OrderFulfillmentCalculator calculator;

    @Test
    void rollupForItems_sumsOrderedBatchedDeliveredAndRemaining() {
        UUID item1Id = UUID.randomUUID();
        UUID item2Id = UUID.randomUUID();
        Order order = Order.builder().build();
        order.setId(UUID.randomUUID());

        OrderItem item1 = OrderItem.builder().order(order).quantity(100).deliveredQuantity(40).build();
        item1.setId(item1Id);
        OrderItem item2 = OrderItem.builder().order(order).quantity(50).deliveredQuantity(50).build();
        item2.setId(item2Id);

        when(productionTaskRepository.sumQuantityByOrderItemId(item1Id)).thenReturn(80);
        when(productionTaskRepository.sumQuantityByOrderItemId(item2Id)).thenReturn(50);

        OrderFulfillmentCalculator.Rollup rollup = calculator.rollupForItems(List.of(item1, item2));

        assertEquals(150, rollup.getOrderedQty());
        assertEquals(130, rollup.getBatchedQty());
        assertEquals(90, rollup.getDeliveredQty());
        assertEquals(20, rollup.getRemainingToBatch());
        assertEquals(60, rollup.getRemainingToDeliver());
        assertFalse(rollup.isFulfillmentComplete());
    }

    @Test
    void rollupForItems_marksCompleteWhenDeliveredMeetsOrdered() {
        UUID itemId = UUID.randomUUID();
        Order order = Order.builder().build();
        OrderItem item = OrderItem.builder().order(order).quantity(100).deliveredQuantity(100).build();
        item.setId(itemId);

        when(productionTaskRepository.sumQuantityByOrderItemId(itemId)).thenReturn(100);

        OrderFulfillmentCalculator.Rollup rollup = calculator.rollupForItems(List.of(item));

        assertTrue(rollup.isFulfillmentComplete());
        assertEquals(0, rollup.getRemainingToDeliver());
    }
}
