package com.tuplastic.erp.production.service;

import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.entity.OrderItem;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.repository.OrderItemRepository;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.production.dto.CreateProductionBatchRequest;
import com.tuplastic.erp.production.entity.ProductionTask;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductionBatchServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private ProductionTaskRepository productionTaskRepository;
    @Mock
    private ProductionTaskService productionTaskService;

    @InjectMocks
    private ProductionBatchService productionBatchService;

    @Test
    void createBatch_rejectsQuantityExceedingRemaining() {
        UUID orderId = UUID.randomUUID();
        UUID orderItemId = UUID.randomUUID();

        Order order = Order.builder().status(OrderStatus.Producing).build();
        order.setId(orderId);

        Product product = Product.builder().name("Tu").build();
        product.setId(UUID.randomUUID());

        OrderItem orderItem = OrderItem.builder()
                .order(order)
                .product(product)
                .quantity(1000)
                .build();
        orderItem.setId(orderItemId);

        CreateProductionBatchRequest request = new CreateProductionBatchRequest();
        request.setOrderItemId(orderItemId);
        request.setQuantity(300);
        request.setExpectedEndDate(LocalDate.now().plusDays(7));

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderItemRepository.findById(orderItemId)).thenReturn(Optional.of(orderItem));
        when(productionTaskRepository.sumQuantityByOrderItemId(orderItemId)).thenReturn(800);

        assertThrows(BadRequestException.class,
                () -> productionBatchService.createBatch(orderId, request));
    }

    @Test
    void createBatch_persistsWaitingTaskWithOrderItem() {
        UUID orderId = UUID.randomUUID();
        UUID orderItemId = UUID.randomUUID();
        LocalDate expectedEndDate = LocalDate.now().plusDays(14);

        Order order = Order.builder().status(OrderStatus.Producing).build();
        order.setId(orderId);

        Product product = Product.builder().name("Tu").build();
        product.setId(UUID.randomUUID());

        OrderItem orderItem = OrderItem.builder()
                .order(order)
                .product(product)
                .quantity(1000)
                .build();
        orderItem.setId(orderItemId);

        CreateProductionBatchRequest request = new CreateProductionBatchRequest();
        request.setOrderItemId(orderItemId);
        request.setQuantity(200);
        request.setExpectedEndDate(expectedEndDate);

        ProductionTask saved = ProductionTask.builder()
                .displayCode("LSX-2026-00001")
                .order(order)
                .orderItem(orderItem)
                .product(product)
                .quantity(200)
                .expectedEndDate(expectedEndDate)
                .status("Waiting")
                .build();
        saved.setId(UUID.randomUUID());

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderItemRepository.findById(orderItemId)).thenReturn(Optional.of(orderItem));
        when(productionTaskRepository.sumQuantityByOrderItemId(orderItemId)).thenReturn(0);
        when(productionTaskRepository.nextProductionTaskNumberSeq()).thenReturn(1L);
        when(productionTaskRepository.save(any(ProductionTask.class))).thenReturn(saved);
        when(productionTaskService.toTaskResponse(saved)).thenReturn(
                com.tuplastic.erp.production.dto.TaskResponse.builder().id(saved.getId()).quantity(200).build());

        productionBatchService.createBatch(orderId, request);

        ArgumentCaptor<ProductionTask> captor = ArgumentCaptor.forClass(ProductionTask.class);
        verify(productionTaskRepository).save(captor.capture());
        ProductionTask task = captor.getValue();
        assertEquals(200, task.getQuantity());
        assertEquals("Waiting", task.getStatus());
        assertEquals(orderItemId, task.getOrderItem().getId());
        assertEquals(expectedEndDate, task.getExpectedEndDate());
        assertTrue(task.getDisplayCode().startsWith("LSX-"));
    }

    @Test
    void createBatch_rejectsExpectedEndDateInPast() {
        UUID orderId = UUID.randomUUID();
        UUID orderItemId = UUID.randomUUID();

        Order order = Order.builder().status(OrderStatus.Producing).build();
        order.setId(orderId);

        Product product = Product.builder().name("Tu").build();
        product.setId(UUID.randomUUID());

        OrderItem orderItem = OrderItem.builder()
                .order(order)
                .product(product)
                .quantity(1000)
                .build();
        orderItem.setId(orderItemId);

        CreateProductionBatchRequest request = new CreateProductionBatchRequest();
        request.setOrderItemId(orderItemId);
        request.setQuantity(100);
        request.setExpectedEndDate(LocalDate.now().minusDays(1));

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderItemRepository.findById(orderItemId)).thenReturn(Optional.of(orderItem));
        when(productionTaskRepository.sumQuantityByOrderItemId(orderItemId)).thenReturn(0);

        assertThrows(BadRequestException.class,
                () -> productionBatchService.createBatch(orderId, request));
    }

    @Test
    void createBatch_rejectsExpectedEndDateAfterDeliveryDate() {
        UUID orderId = UUID.randomUUID();
        UUID orderItemId = UUID.randomUUID();
        LocalDate deliveryDate = LocalDate.now().plusDays(30);
        LocalDate endDate = deliveryDate.plusDays(1);

        Order order = Order.builder()
                .status(OrderStatus.Producing)
                .expectedDeliveryDate(deliveryDate)
                .build();
        order.setId(orderId);

        Product product = Product.builder().name("Tu").build();
        product.setId(UUID.randomUUID());

        OrderItem orderItem = OrderItem.builder()
                .order(order)
                .product(product)
                .quantity(1000)
                .build();
        orderItem.setId(orderItemId);

        CreateProductionBatchRequest request = new CreateProductionBatchRequest();
        request.setOrderItemId(orderItemId);
        request.setQuantity(100);
        request.setExpectedEndDate(endDate);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderItemRepository.findById(orderItemId)).thenReturn(Optional.of(orderItem));
        when(productionTaskRepository.sumQuantityByOrderItemId(orderItemId)).thenReturn(0);

        assertThrows(BadRequestException.class,
                () -> productionBatchService.createBatch(orderId, request));
    }

    @Test
    void createBatch_allowsExpectedEndDateWhenOrderHasNoDeliveryDate() {
        UUID orderId = UUID.randomUUID();
        UUID orderItemId = UUID.randomUUID();
        LocalDate expectedEndDate = LocalDate.now().plusDays(5);

        Order order = Order.builder().status(OrderStatus.Producing).build();
        order.setId(orderId);

        Product product = Product.builder().name("Tu").build();
        product.setId(UUID.randomUUID());

        OrderItem orderItem = OrderItem.builder()
                .order(order)
                .product(product)
                .quantity(1000)
                .build();
        orderItem.setId(orderItemId);

        CreateProductionBatchRequest request = new CreateProductionBatchRequest();
        request.setOrderItemId(orderItemId);
        request.setQuantity(100);
        request.setExpectedEndDate(expectedEndDate);

        ProductionTask saved = ProductionTask.builder()
                .displayCode("LSX-2026-00001")
                .order(order)
                .orderItem(orderItem)
                .product(product)
                .quantity(100)
                .expectedEndDate(expectedEndDate)
                .status("Waiting")
                .build();
        saved.setId(UUID.randomUUID());

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderItemRepository.findById(orderItemId)).thenReturn(Optional.of(orderItem));
        when(productionTaskRepository.sumQuantityByOrderItemId(orderItemId)).thenReturn(0);
        when(productionTaskRepository.nextProductionTaskNumberSeq()).thenReturn(1L);
        when(productionTaskRepository.save(any(ProductionTask.class))).thenReturn(saved);
        when(productionTaskService.toTaskResponse(saved)).thenReturn(
                com.tuplastic.erp.production.dto.TaskResponse.builder().id(saved.getId()).quantity(100).build());

        productionBatchService.createBatch(orderId, request);

        ArgumentCaptor<ProductionTask> captor = ArgumentCaptor.forClass(ProductionTask.class);
        verify(productionTaskRepository).save(captor.capture());
        assertEquals(expectedEndDate, captor.getValue().getExpectedEndDate());
    }
}
