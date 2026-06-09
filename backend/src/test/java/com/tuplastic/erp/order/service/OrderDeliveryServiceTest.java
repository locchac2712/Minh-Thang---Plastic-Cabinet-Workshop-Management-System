package com.tuplastic.erp.order.service;

import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.BusinessLogicException;
import com.tuplastic.erp.order.dto.DeliverBatchRequest;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.entity.OrderItem;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.mapper.OrderMapper;
import com.tuplastic.erp.order.repository.OrderItemRepository;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.product.repository.ProductRepository;
import com.tuplastic.erp.production.entity.ProductionTask;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.productinventory.repository.ProductInventoryLogRepository;
import com.tuplastic.erp.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderDeliveryServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private ProductionTaskRepository productionTaskRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductInventoryLogRepository productInventoryLogRepository;
    @Mock
    private AgencyRepository agencyRepository;
    @Mock
    private OrderMapper orderMapper;

    @InjectMocks
    private OrderDeliveryService orderDeliveryService;

    @Test
    void deliverBatch_rejectsAlreadyDeliveredTask() {
        UUID orderId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Order order = Order.builder().status(OrderStatus.Producing).build();
        order.setId(orderId);

        ProductionTask task = ProductionTask.builder()
                .order(order)
                .status("Done")
                .quantity(100)
                .deliveredAt(java.time.LocalDateTime.now())
                .build();
        task.setId(taskId);

        when(orderRepository.findByIdAndCreatedById(orderId, sellerId)).thenReturn(Optional.of(order));
        when(productionTaskRepository.findById(taskId)).thenReturn(Optional.of(task));

        assertThrows(BadRequestException.class,
                () -> orderDeliveryService.deliverBatch(orderId,
                        DeliverBatchRequest.builder()
                                .taskId(taskId)
                                .deliveryAddress("KCN Long Hậu")
                                .deliveryProofImageUrl("https://cdn.example/proof.jpg")
                                .build(),
                        seller));
    }

    @Test
    void markDone_rejectsWhenDeliveredQuantityInsufficient() {
        UUID orderId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID orderItemId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Agency agency = Agency.builder().totalDebt(BigDecimal.ZERO).build();
        Order order = Order.builder()
                .status(OrderStatus.Producing)
                .agency(agency)
                .totalPayable(BigDecimal.valueOf(1000))
                .paidAmount(BigDecimal.ZERO)
                .build();
        order.setId(orderId);

        Product product = Product.builder().name("Tu").build();
        product.setId(UUID.randomUUID());

        OrderItem item = OrderItem.builder()
                .order(order)
                .product(product)
                .quantity(1000)
                .deliveredQuantity(200)
                .build();
        item.setId(orderItemId);

        ProductionTask task = ProductionTask.builder()
                .order(order)
                .orderItem(item)
                .status("Done")
                .quantity(200)
                .deliveredAt(java.time.LocalDateTime.now())
                .build();
        task.setId(UUID.randomUUID());

        when(orderRepository.findByIdAndCreatedById(orderId, sellerId)).thenReturn(Optional.of(order));
        when(productionTaskRepository.findByOrder_IdOrderByCreatedAtAsc(orderId)).thenReturn(List.of(task));
        when(orderItemRepository.findByOrderIdOrderByCreatedAtAsc(orderId)).thenReturn(List.of(item));
        when(productionTaskRepository.sumQuantityByOrderItemId(orderItemId)).thenReturn(200);

        assertThrows(BusinessLogicException.class,
                () -> orderDeliveryService.markDone(orderId, seller));
    }
}
