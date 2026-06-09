package com.tuplastic.erp.director.service;

import com.tuplastic.erp.common.exception.BusinessLogicException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.inventory.entity.InventoryLog;
import com.tuplastic.erp.inventory.repository.InventoryLogRepository;
import com.tuplastic.erp.material.entity.Material;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.production.entity.ProductionTask;
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.director.dto.DirectorOrderWasteSummaryResponse;
import com.tuplastic.erp.order.repository.OrderItemRepository;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.order.service.OrderFulfillmentCalculator;
import com.tuplastic.erp.order.service.OrderFulfillmentService;
import com.tuplastic.erp.activitylog.service.ActivityLogService;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.production.service.ProductionTaskService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DirectorOperationsServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private ProductionTaskRepository productionTaskRepository;
    @Mock
    private OrderFulfillmentCalculator fulfillmentCalculator;
    @Mock
    private ActivityLogService activityLogService;
    @Mock
    private OrderFulfillmentService orderFulfillmentService;
    @Mock
    private ProductionTaskService productionTaskService;
    @Mock
    private InventoryLogRepository inventoryLogRepository;

    @InjectMocks
    private DirectorOperationsService directorOperationsService;

    @Test
    void getOrderProductionTasks_rejectsQuotationPhase() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder().status(OrderStatus.Pending).build();
        order.setId(orderId);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        assertThrows(BusinessLogicException.class,
                () -> directorOperationsService.getOrderProductionTasks(orderId));
    }

    @Test
    void getOrderProductionTasks_rejectsQuotationTemplate() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder().status(OrderStatus.Approved).build();
        order.setId(orderId);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        assertThrows(ResourceNotFoundException.class,
                () -> directorOperationsService.getOrderProductionTasks(orderId));
    }

    @Test
    void getOrderWaste_aggregatesDamageAndEvents() {
        UUID orderId = UUID.randomUUID();
        UUID materialId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        UUID logId = UUID.randomUUID();

        Order source = Order.builder().build();
        source.setId(UUID.randomUUID());
        Order order = Order.builder().status(OrderStatus.Producing).sourceOrder(source).build();
        order.setId(orderId);

        Material material = Material.builder().code("VL-01").name("Ván MDF").unit("tấm").build();
        material.setId(materialId);

        Product product = Product.builder().name("Tủ bếp").build();
        User pic = User.builder().fullName("Nguyen Van A").build();

        ProductionTask task = ProductionTask.builder().order(order).product(product).assignedTo(pic).build();
        task.setId(taskId);

        InventoryLog log = InventoryLog.builder()
                .material(material)
                .task(task)
                .transactionType("WASTE")
                .quantityChange(new BigDecimal("-2"))
                .unitPriceAtTime(new BigDecimal("150000"))
                .build();
        log.setId(logId);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(inventoryLogRepository.findWasteLogsByOrderId(orderId)).thenReturn(List.of(log));

        DirectorOrderWasteSummaryResponse response = directorOperationsService.getOrderWaste(orderId);

        assertEquals(orderId, response.getOrderId());
        assertEquals(1, response.getWasteEventCount());
        assertEquals(new BigDecimal("300000"), response.getEstimatedDamageVnd());
        assertEquals(new BigDecimal("2"), response.getDiscardedBoardEquivalent());
        assertEquals(1, response.getMaterialRows().size());
        assertEquals(1, response.getEvents().size());
        assertEquals(taskId, response.getEvents().get(0).getTaskId());
    }
}
