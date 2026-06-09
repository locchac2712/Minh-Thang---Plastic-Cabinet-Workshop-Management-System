package com.tuplastic.erp.production.service;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.order.service.OrderService;
import com.tuplastic.erp.production.dto.ProductionOrderDetailDto;
import com.tuplastic.erp.production.dto.ProductionOrderQueueItemDto;
import com.tuplastic.erp.production.repository.ProductionOrderQueueRow;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductionOrderQueueServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderService orderService;

    @InjectMocks
    private ProductionOrderQueueService productionOrderQueueService;

    @Test
    void listOrders_defaultsToProducingWhenStatusBlank() {
        when(orderService.parseStatuses("Producing")).thenReturn(List.of(OrderStatus.Producing));

        ProductionOrderQueueRow row = mock(ProductionOrderQueueRow.class);
        UUID orderId = UUID.randomUUID();
        when(row.getOrderId()).thenReturn(orderId);
        when(row.getOrderDisplayCode()).thenReturn("DH-2026-00018");
        when(row.getAgencyName()).thenReturn("Đại lý A");
        when(row.getExpectedDeliveryDate()).thenReturn(LocalDate.of(2026, 6, 1));
        when(row.getCreatedAt()).thenReturn(LocalDateTime.of(2026, 5, 1, 10, 0));
        when(row.getTaskCount()).thenReturn(0L);
        when(row.getRemainingBatchableTotal()).thenReturn(1000L);

        Page<ProductionOrderQueueRow> page = new PageImpl<>(List.of(row), PageRequest.of(0, 20), 1);
        when(orderRepository.findProductionOrderQueue(
                eq(List.of("Producing")), eq(true), isNull(), any()))
                .thenReturn(page);

        PageResponse<ProductionOrderQueueItemDto> result =
                productionOrderQueueService.listOrders("Producing", true, null, 0, 20);

        assertEquals(1, result.getContent().size());
        ProductionOrderQueueItemDto item = result.getContent().get(0);
        assertEquals(orderId, item.getOrderId());
        assertEquals("DH-2026-00018", item.getOrderDisplayCode());
        assertEquals(0L, item.getTaskCount());
        assertEquals(1000, item.getRemainingBatchableTotal());
        assertTrue(item.isHasPendingBatch());
    }

    @Test
    void listOrders_noPendingBatchWhenFullyBatched() {
        when(orderService.parseStatuses(isNull())).thenReturn(null);

        ProductionOrderQueueRow row = mock(ProductionOrderQueueRow.class);
        when(row.getOrderId()).thenReturn(UUID.randomUUID());
        when(row.getAgencyName()).thenReturn("Đại lý B");
        when(row.getTaskCount()).thenReturn(3L);
        when(row.getRemainingBatchableTotal()).thenReturn(0L);

        Page<ProductionOrderQueueRow> page = new PageImpl<>(List.of(row));
        when(orderRepository.findProductionOrderQueue(
                eq(List.of("Producing")), isNull(), isNull(), any()))
                .thenReturn(page);

        PageResponse<ProductionOrderQueueItemDto> result =
                productionOrderQueueService.listOrders(null, null, null, 0, 20);

        assertFalse(result.getContent().get(0).isHasPendingBatch());
    }

    @Test
    void getOrderDetail_mapsStats() {
        UUID orderId = UUID.randomUUID();
        var agency = com.tuplastic.erp.agency.entity.Agency.builder().name("Agency X").build();
        Order order = Order.builder()
                .status(OrderStatus.Producing)
                .displayCode("DH-2026-00020")
                .shippingAddress("Kho A")
                .agency(agency)
                .build();
        order.setId(orderId);

        ProductionOrderQueueRow stats = mock(ProductionOrderQueueRow.class);
        when(stats.getTaskCount()).thenReturn(2L);
        when(stats.getRemainingBatchableTotal()).thenReturn(200L);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.findProductionOrderQueueStats(orderId)).thenReturn(Optional.of(stats));

        ProductionOrderDetailDto detail = productionOrderQueueService.getOrderDetail(orderId);

        assertEquals(orderId, detail.getOrderId());
        assertEquals("DH-2026-00020", detail.getOrderDisplayCode());
        assertEquals("Agency X", detail.getAgencyName());
        assertEquals(2L, detail.getTaskCount());
        assertEquals(200, detail.getRemainingBatchableTotal());
        assertTrue(detail.isHasPendingBatch());
    }
}
