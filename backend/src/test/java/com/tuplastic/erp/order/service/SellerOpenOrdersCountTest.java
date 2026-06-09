package com.tuplastic.erp.order.service;

import com.tuplastic.erp.order.dto.chart.SellerOpenOrdersCountResponse;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.user.entity.User;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SellerOpenOrdersCountTest {

    @Mock
    private EntityManager entityManager;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private SellerChartService sellerChartService;

    @Test
    void getMyOpenOrdersCount_countsApprovedAndProducingFulfillmentOnly() {
        UUID sellerId = UUID.randomUUID();
        User seller = User.builder().build();
        seller.setId(sellerId);

        when(orderRepository.countFulfillmentOrdersBySellerAndStatuses(eq(sellerId), eq(List.of(
                OrderStatus.Approved, OrderStatus.Producing))))
                .thenReturn(List.of(
                        new Object[] { OrderStatus.Approved, 3L },
                        new Object[] { OrderStatus.Producing, 2L }));

        SellerOpenOrdersCountResponse result = sellerChartService.getMyOpenOrdersCount(seller);

        assertEquals(3L, result.getApprovedCount());
        assertEquals(2L, result.getProducingCount());
        assertEquals(5L, result.getCount());
    }

    @Test
    void getMyOpenOrdersCount_emptyWhenNoOpenFulfillment() {
        UUID sellerId = UUID.randomUUID();
        User seller = User.builder().build();
        seller.setId(sellerId);

        when(orderRepository.countFulfillmentOrdersBySellerAndStatuses(eq(sellerId), eq(List.of(
                OrderStatus.Approved, OrderStatus.Producing))))
                .thenReturn(List.of());

        SellerOpenOrdersCountResponse result = sellerChartService.getMyOpenOrdersCount(seller);

        assertEquals(0L, result.getApprovedCount());
        assertEquals(0L, result.getProducingCount());
        assertEquals(0L, result.getCount());
    }
}
