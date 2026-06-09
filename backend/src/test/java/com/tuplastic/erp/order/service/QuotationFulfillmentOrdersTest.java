package com.tuplastic.erp.order.service;

import com.tuplastic.erp.activitylog.repository.ActivityLogRepository;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuotationFulfillmentOrdersTest {

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
    void getSellerQuotationFulfillmentOrders_usesChildOrdersSpec() {
        UUID sellerId = UUID.randomUUID();
        UUID quotationId = UUID.randomUUID();
        User seller = User.builder().build();
        seller.setId(sellerId);

        Order quotation = Order.builder()
                .displayCode("BG-2026-00001")
                .status(OrderStatus.Approved)
                .build();
        quotation.setId(quotationId);

        Order child = Order.builder()
                .displayCode("DH-2026-00018")
                .status(OrderStatus.Approved)
                .build();
        child.setId(UUID.randomUUID());

        when(orderRepository.findByDisplayCodeAndCreatedById("BG-2026-00001", sellerId))
                .thenReturn(Optional.of(quotation));
        when(orderRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(child)));
        when(orderMapper.toResponse(child)).thenReturn(
                OrderResponse.builder().id(child.getId()).displayCode("DH-2026-00018").status("Approved").build());

        PageResponse<OrderResponse> page = orderService.getSellerQuotationFulfillmentOrders(
                "BG-2026-00001", seller, null, 0, 20);

        assertEquals(1, page.getTotalElements());
        assertEquals("DH-2026-00018", page.getContent().get(0).getDisplayCode());
        verify(orderRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getSellerQuotationFulfillmentOrders_rejectsFulfillmentRecordAsQuotation() {
        UUID sellerId = UUID.randomUUID();
        User seller = User.builder().build();
        seller.setId(sellerId);

        Order source = Order.builder().displayCode("BG-2026-00001").build();
        source.setId(UUID.randomUUID());

        Order fulfillment = Order.builder()
                .displayCode("DH-2026-00018")
                .status(OrderStatus.Approved)
                .sourceOrder(source)
                .build();
        fulfillment.setId(UUID.randomUUID());

        when(orderRepository.findByDisplayCodeAndCreatedById("DH-2026-00018", sellerId))
                .thenReturn(Optional.of(fulfillment));

        assertThrows(ResourceNotFoundException.class,
                () -> orderService.getSellerQuotationFulfillmentOrders("DH-2026-00018", seller, null, 0, 20));
    }

    @Test
    void getSellerQuotationFulfillmentOrders_notFoundWhenMissing() {
        UUID sellerId = UUID.randomUUID();
        User seller = User.builder().build();
        seller.setId(sellerId);

        when(orderRepository.findByDisplayCodeAndCreatedById("BG-2026-99999", sellerId))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> orderService.getSellerQuotationFulfillmentOrders("BG-2026-99999", seller, null, 0, 20));
    }
}
