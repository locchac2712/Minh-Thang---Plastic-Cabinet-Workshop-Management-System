package com.tuplastic.erp.production.service;

import com.tuplastic.erp.activitylog.repository.ActivityLogRepository;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.production.entity.ProductionTask;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.production.repository.ProductionTaskTrackingTokenRepository;
import com.tuplastic.erp.security.util.TokenHashUtils;
import com.tuplastic.erp.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskTrackingServiceTest {

    @Mock
    private ProductionTaskTrackingTokenRepository trackingTokenRepository;
    @Mock
    private ProductionTaskRepository productionTaskRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ActivityLogRepository activityLogRepository;

    @InjectMocks
    private TaskTrackingService taskTrackingService;

    private final UUID orderId = UUID.randomUUID();
    private final UUID taskId = UUID.randomUUID();
    private final UUID sellerId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(taskTrackingService, "tokenValidityMs", 86_400_000L);
        ReflectionTestUtils.setField(taskTrackingService, "frontendBaseUrl", "http://localhost:5173");
    }

    @Test
    void createShareLink_rejectsUnknownOrder() {
        User seller = new User();
        seller.setId(sellerId);
        when(orderRepository.findByIdAndCreatedById(orderId, sellerId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> taskTrackingService.createOrGetShareLink(orderId, taskId, seller));
    }

    @Test
    void getByPlainToken_rejectsInvalidToken() {
        when(trackingTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class,
                () -> taskTrackingService.getByPlainToken("not-a-real-token"));
    }

    @Test
    void createShareLink_savesHashedToken() {
        User seller = new User();
        seller.setId(sellerId);
        Order order = Order.builder().status(OrderStatus.Producing).build();
        order.setId(orderId);
        ProductionTask task = ProductionTask.builder().status("Doing").quantity(5).build();
        task.setId(taskId);
        task.setOrder(order);

        when(orderRepository.findByIdAndCreatedById(orderId, sellerId)).thenReturn(Optional.of(order));
        when(productionTaskRepository.findById(taskId)).thenReturn(Optional.of(task));

        var response = taskTrackingService.createOrGetShareLink(orderId, taskId, seller);

        ArgumentCaptor<com.tuplastic.erp.production.entity.ProductionTaskTrackingToken> captor =
                ArgumentCaptor.forClass(com.tuplastic.erp.production.entity.ProductionTaskTrackingToken.class);
        verify(trackingTokenRepository).save(captor.capture());
        assertEquals(taskId, captor.getValue().getTask().getId());
        assertEquals(64, captor.getValue().getTokenHash().length());
        verify(trackingTokenRepository).revokeActiveByTaskId(eq(taskId), any(LocalDateTime.class));
        org.junit.jupiter.api.Assertions.assertTrue(response.getUrl().startsWith("http://localhost:5173/track/"));
    }

    @Test
    void getByPlainToken_resolvesValidToken() {
        String plain = "abc123token";
        String hash = TokenHashUtils.sha256Hex(plain);
        Order order = Order.builder().status(OrderStatus.Producing).build();
        order.setId(orderId);
        ProductionTask task = ProductionTask.builder().status("Doing").quantity(3).build();
        task.setId(taskId);
        task.setOrder(order);

        var row = com.tuplastic.erp.production.entity.ProductionTaskTrackingToken.builder()
                .task(task)
                .tokenHash(hash)
                .expiresAt(LocalDateTime.now().plusDays(1))
                .build();

        when(trackingTokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(row));
        when(activityLogRepository.findByTaskIdOrderByCreatedAtAsc(taskId)).thenReturn(java.util.List.of());

        var response = taskTrackingService.getByPlainToken(plain);
        assertEquals("Doing", response.getStatus());
        assertEquals(3, response.getQuantity());
    }
}
