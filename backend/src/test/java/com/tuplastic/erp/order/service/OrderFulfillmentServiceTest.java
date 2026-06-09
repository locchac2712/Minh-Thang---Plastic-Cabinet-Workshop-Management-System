package com.tuplastic.erp.order.service;

import com.tuplastic.erp.order.dto.OrderFulfillmentSummaryDto;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.entity.OrderItem;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.repository.OrderItemRepository;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderFulfillmentServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private ProductionTaskRepository productionTaskRepository;

    @InjectMocks
    private OrderFulfillmentService orderFulfillmentService;

    @Test
    void buildSummary_aggregatesBatchedAndDeliveredPerLine() {
        UUID orderId = UUID.randomUUID();
        UUID itemId = UUID.randomUUID();
        Order order = Order.builder().status(OrderStatus.Producing).build();
        order.setId(orderId);
        Product product = Product.builder().name("Tu").build();
        product.setId(UUID.randomUUID());
        OrderItem item = OrderItem.builder().order(order).product(product).quantity(100).deliveredQuantity(40).build();
        item.setId(itemId);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrderIdOrderByCreatedAtAsc(orderId)).thenReturn(List.of(item));
        when(productionTaskRepository.sumQuantityByOrderItemId(itemId)).thenReturn(80);

        OrderFulfillmentSummaryDto summary = orderFulfillmentService.buildSummary(orderId);

        assertEquals(orderId, summary.getOrderId());
        assertEquals("Producing", summary.getStatus());
        assertEquals(1, summary.getLines().size());
        OrderFulfillmentSummaryDto.FulfillmentLineDto line = summary.getLines().get(0);
        assertEquals(100, line.getOrderedQuantity());
        assertEquals(80, line.getBatchedQuantity());
        assertEquals(40, line.getDeliveredQuantity());
        assertEquals(20, line.getRemainingToBatch());
        assertEquals(60, line.getRemainingToDeliver());
    }
}
