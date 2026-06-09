package com.tuplastic.erp.order.service;

import com.tuplastic.erp.activitylog.repository.ActivityLogRepository;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.invoice.repository.InvoiceRepository;
import com.tuplastic.erp.notification.service.NotificationService;
import com.tuplastic.erp.order.dto.OrderResponse;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.mapper.OrderMapper;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.product.repository.ProductRepository;
import com.tuplastic.erp.productinventory.repository.ProductInventoryLogRepository;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AgencyOrdersFulfillmentLensTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private AgencyRepository agencyRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductionTaskRepository productionTaskRepository;
    @Mock
    private ProductInventoryLogRepository productInventoryLogRepository;
    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private ActivityLogRepository activityLogRepository;
    @Mock
    private OrderMapper orderMapper;
    @Mock
    private NotificationService notificationService;
    @Mock
    private OrderDeliveryService orderDeliveryService;

    @InjectMocks
    private OrderService orderService;

    @Test
    void getAgencyOrders_usesSpecificationQuery() {
        UUID agencyId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        User seller = User.builder().build();
        seller.setId(sellerId);

        Order fulfillment = Order.builder()
                .displayCode("DH-2026-00020")
                .status(OrderStatus.Approved)
                .build();
        fulfillment.setId(UUID.randomUUID());

        when(agencyRepository.findByIdAndAssignedSellerId(agencyId, sellerId))
                .thenReturn(java.util.Optional.of(com.tuplastic.erp.agency.entity.Agency.builder().build()));
        when(orderRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(fulfillment)));
        when(orderMapper.toResponse(fulfillment)).thenReturn(
                OrderResponse.builder().displayCode("DH-2026-00020").status("Approved").build());

        PageResponse<OrderResponse> page = orderService.getAgencyOrders(agencyId, seller, null, 0, 20);

        assertEquals(1, page.getTotalElements());
        verify(orderRepository).findAll(any(Specification.class), any(Pageable.class));
    }
}
