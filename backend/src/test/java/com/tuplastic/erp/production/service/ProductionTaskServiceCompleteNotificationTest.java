package com.tuplastic.erp.production.service;

import com.tuplastic.erp.activitylog.repository.ActivityLogRepository;
import com.tuplastic.erp.bom.repository.BomItemRepository;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.inventory.repository.InventoryLogRepository;
import com.tuplastic.erp.material.repository.MaterialRepository;
import com.tuplastic.erp.notification.service.NotificationService;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.mapper.OrderMapper;
import com.tuplastic.erp.order.util.OrderDisplayCodeUtils;
import com.tuplastic.erp.product.repository.ProductRepository;
import com.tuplastic.erp.productinventory.repository.ProductInventoryLogRepository;
import com.tuplastic.erp.production.entity.ProductionTask;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.production.util.ProductionTaskDisplayCodeUtils;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductionTaskServiceCompleteNotificationTest {

    @Mock
    private ProductionTaskRepository taskRepository;
    @Mock
    private ActivityLogRepository activityLogRepository;
    @Mock
    private BomItemRepository bomItemRepository;
    @Mock
    private InventoryLogRepository inventoryLogRepository;
    @Mock
    private ProductInventoryLogRepository productInventoryLogRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private MaterialRepository materialRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OrderMapper orderMapper;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ProductionTaskService productionTaskService;

    @Test
    void completeTask_notifiesSellerWhenTaskLinkedToOrder() {
        UUID taskId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();

        User seller = User.builder().fullName("Seller A").build();
        seller.setId(sellerId);

        User productionUser = User.builder().fullName("Worker").build();
        productionUser.setId(UUID.randomUUID());

        Order order = Order.builder()
                .displayCode("DH-2026-00001")
                .createdBy(seller)
                .build();
        order.setId(orderId);

        ProductionTask task = ProductionTask.builder()
                .status("Doing")
                .quantity(500)
                .displayCode("LSX-2026-00001")
                .order(order)
                .build();
        task.setId(taskId);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(activityLogRepository.countByTaskId(taskId)).thenReturn(1L);
        when(taskRepository.save(any(ProductionTask.class))).thenAnswer(inv -> inv.getArgument(0));

        productionTaskService.completeTask(taskId.toString(), productionUser);

        String orderRef = OrderDisplayCodeUtils.displayRef(order.getDisplayCode(), order.getId());
        String batchRef = ProductionTaskDisplayCodeUtils.displayRef(task.getDisplayCode(), task.getId());

        verify(notificationService).notifyUser(
                eq(seller),
                eq("PRODUCTION_BATCH_COMPLETED"),
                eq("Lô sản xuất đã hoàn thành"),
                eq(String.format(
                        "Lô %s (SL %d) của đơn %s đã xong xưởng. Có thể giao lô qua deliver-batch.",
                        batchRef,
                        500,
                        orderRef)),
                eq("/seller/orders/" + orderRef),
                eq("production-batch-completed:" + taskId),
                eq(productionUser),
                isNull());
    }

    @Test
    void completeTask_doesNotNotifyWhenTaskHasNoOrder() {
        UUID taskId = UUID.randomUUID();

        User productionUser = User.builder().build();
        productionUser.setId(UUID.randomUUID());

        ProductionTask task = ProductionTask.builder()
                .status("Doing")
                .quantity(100)
                .build();
        task.setId(taskId);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(activityLogRepository.countByTaskId(taskId)).thenReturn(1L);
        when(taskRepository.save(any(ProductionTask.class))).thenAnswer(inv -> inv.getArgument(0));

        productionTaskService.completeTask(taskId.toString(), productionUser);

        verify(notificationService, never()).notifyUser(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void completeTask_rejectsWhenNoActivityLogs() {
        UUID taskId = UUID.randomUUID();

        User productionUser = User.builder().build();
        productionUser.setId(UUID.randomUUID());

        ProductionTask task = ProductionTask.builder()
                .status("Doing")
                .quantity(100)
                .build();
        task.setId(taskId);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(activityLogRepository.countByTaskId(taskId)).thenReturn(0L);

        assertThrows(BadRequestException.class,
                () -> productionTaskService.completeTask(taskId.toString(), productionUser));

        verify(taskRepository, never()).save(any());
        verify(notificationService, never()).notifyUser(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void completeTask_doesNotNotifyWhenWrongStatus() {
        UUID taskId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Order order = Order.builder().createdBy(seller).build();
        order.setId(UUID.randomUUID());

        ProductionTask task = ProductionTask.builder()
                .status("Waiting")
                .order(order)
                .build();
        task.setId(taskId);

        User productionUser = User.builder().build();
        productionUser.setId(UUID.randomUUID());

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        assertThrows(BadRequestException.class,
                () -> productionTaskService.completeTask(taskId.toString(), productionUser));

        verify(taskRepository, never()).save(any());
        verify(notificationService, never()).notifyUser(any(), any(), any(), any(), any(), any(), any(), any());
    }
}
