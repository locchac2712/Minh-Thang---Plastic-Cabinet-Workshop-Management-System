package com.tuplastic.erp.order.service;

import com.tuplastic.erp.activitylog.repository.ActivityLogRepository;
import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.invoice.repository.InvoiceRepository;
import com.tuplastic.erp.notification.service.NotificationService;
import com.tuplastic.erp.order.dto.CreateOrderItemRequest;
import com.tuplastic.erp.order.dto.CreateOrderRequest;
import com.tuplastic.erp.order.dto.OrderResponse;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.entity.OrderItem;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.mapper.OrderMapper;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.product.repository.ProductRepository;
import com.tuplastic.erp.productinventory.repository.ProductInventoryLogRepository;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderDisplayCodeTest {

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
    void createDraftOrder_quotation_allocatesBgCode() {
        UUID agencyId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Agency agency = Agency.builder().name("Agency").build();
        agency.setId(agencyId);

        Product product = catalogProduct(productId);
        CreateOrderRequest request = baseRequest(agencyId, productId, null, BigDecimal.valueOf(100), 1);

        when(agencyRepository.findByIdAndAssignedSellerId(agencyId, sellerId))
                .thenReturn(Optional.of(agency));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(orderRepository.nextQuotationNumberSeq()).thenReturn(42L);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderMapper.toResponse(any(Order.class))).thenReturn(OrderResponse.builder().displayCode("BG-2026-00042").build());

        orderService.createDraftOrder(request, seller);

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(captor.capture());
        assertTrue(captor.getValue().getDisplayCode().startsWith("BG-"));
    }

    @Test
    void createDraftOrder_fulfillment_allocatesDhCode() {
        UUID agencyId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID sourceId = UUID.randomUUID();
        UUID approverId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        User approver = User.builder().build();
        approver.setId(approverId);

        Agency agency = agencyWithDebtLimits();
        agency.setId(agencyId);

        Product product = catalogProduct(productId);

        OrderItem sourceLine = OrderItem.builder()
                .product(product)
                .quantity(10)
                .unitPrice(BigDecimal.valueOf(100))
                .unitCostAtTime(BigDecimal.valueOf(50))
                .build();

        Order source = Order.builder()
                .agency(agency)
                .createdBy(seller)
                .approver(approver)
                .displayCode("BG-2026-00001")
                .status(OrderStatus.Approved)
                .discountAmount(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .quotationValidUntil(LocalDate.now().plusDays(7))
                .build();
        source.setId(sourceId);
        sourceLine.setOrder(source);
        source.getItems().add(sourceLine);

        CreateOrderRequest request = baseRequest(agencyId, productId, sourceId, BigDecimal.valueOf(100), 3);

        when(agencyRepository.findByIdAndAssignedSellerId(agencyId, sellerId))
                .thenReturn(Optional.of(agency));
        when(orderRepository.findByIdAndCreatedById(sourceId, sellerId)).thenReturn(Optional.of(source));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(orderRepository.nextOrderNumberSeq()).thenReturn(18L);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderMapper.toResponse(any(Order.class))).thenReturn(
                OrderResponse.builder().displayCode("DH-2026-00018").sourceDisplayCode("BG-2026-00001").build());

        orderService.createDraftOrder(request, seller);

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(captor.capture());
        assertTrue(captor.getValue().getDisplayCode().startsWith("DH-"));
    }

    @Test
    void getSellerOrderDetail_resolvesByDisplayCode() {
        UUID sellerId = UUID.randomUUID();
        User seller = User.builder().build();
        seller.setId(sellerId);

        Order order = Order.builder()
                .displayCode("DH-2026-00018")
                .status(OrderStatus.Approved)
                .build();
        Order source = Order.builder().displayCode("BG-2026-00001").build();
        source.setId(UUID.randomUUID());
        order.setSourceOrder(source);
        order.setId(UUID.randomUUID());

        when(orderRepository.findByDisplayCodeAndCreatedById("DH-2026-00018", sellerId))
                .thenReturn(Optional.of(order));
        when(orderMapper.toResponse(order)).thenReturn(
                OrderResponse.builder().displayCode("DH-2026-00018").sourceDisplayCode("BG-2026-00001").build());

        OrderResponse response = orderService.getSellerOrderDetail("DH-2026-00018", seller);

        assertEquals("DH-2026-00018", response.getDisplayCode());
        assertEquals("BG-2026-00001", response.getSourceDisplayCode());
    }

    @Test
    void getSellerQuotationDetail_rejectsFulfillmentRecord() {
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
                () -> orderService.getSellerQuotationDetail("DH-2026-00018", seller));
    }

    @Test
    void getSellerOrders_usesFulfillmentOnlyQuery() {
        UUID sellerId = UUID.randomUUID();
        User seller = User.builder().build();
        seller.setId(sellerId);

        when(orderRepository.findFulfillmentOrdersBySellerWithFilters(eq(sellerId), eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        orderService.getSellerOrders(seller, null, 0, 20);

        verify(orderRepository).findFulfillmentOrdersBySellerWithFilters(eq(sellerId), eq(null), any(Pageable.class));
    }

    @Test
    void getSellerQuotations_usesSpecificationQuery() {
        UUID sellerId = UUID.randomUUID();
        User seller = User.builder().build();
        seller.setId(sellerId);

        when(orderRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        orderService.getSellerQuotations(seller, null, null, 0, 20);

        verify(orderRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getSellerQuotations_blankSearch_usesSpecificationQuery() {
        UUID sellerId = UUID.randomUUID();
        User seller = User.builder().build();
        seller.setId(sellerId);

        when(orderRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        orderService.getSellerQuotations(seller, null, "   ", 0, 20);

        verify(orderRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getSellerQuotations_withSearch_usesSpecificationQuery() {
        UUID sellerId = UUID.randomUUID();
        User seller = User.builder().build();
        seller.setId(sellerId);

        when(orderRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        orderService.getSellerQuotations(seller, null, "bg-2026", 0, 20);

        verify(orderRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void normalizeQuotationSearch_mapsBlankToNull() {
        assertNull(OrderService.normalizeQuotationSearch(null));
        assertNull(OrderService.normalizeQuotationSearch("  "));
        assertEquals("BG-1", OrderService.normalizeQuotationSearch("bg-1"));
    }

    private static Agency agencyWithDebtLimits() {
        Agency agency = Agency.builder().name("Test Agency").build();
        agency.setTotalDebt(BigDecimal.ZERO);
        agency.setMaxDebtLimit(new BigDecimal("50000000"));
        return agency;
    }

    private static Product catalogProduct(UUID productId) {
        Product product = Product.builder()
                .name("Tu")
                .sku("TU-1")
                .costPrice(BigDecimal.TEN)
                .isCustom(false)
                .build();
        product.setId(productId);
        return product;
    }

    private static CreateOrderRequest baseRequest(
            UUID agencyId,
            UUID productId,
            UUID sourceOrderId,
            BigDecimal unitPrice,
            int quantity) {
        CreateOrderItemRequest itemReq = new CreateOrderItemRequest();
        itemReq.setProductId(productId);
        itemReq.setQuantity(quantity);
        itemReq.setUnitPrice(unitPrice);

        CreateOrderRequest request = new CreateOrderRequest();
        request.setAgencyId(agencyId);
        request.setSourceOrderId(sourceOrderId);
        request.setDiscountAmount(BigDecimal.ZERO);
        request.setShippingFee(BigDecimal.ZERO);
        request.setItems(List.of(itemReq));
        return request;
    }

    @Test
    void quotationViewFromOrderStatus_mapsCanceledSeparatelyFromApproved() {
        assertEquals("Canceled", OrderService.quotationViewFromOrderStatus(OrderStatus.Canceled));
        assertEquals("Approved", OrderService.quotationViewFromOrderStatus(OrderStatus.Approved));
        assertEquals("Draft", OrderService.quotationViewFromOrderStatus(OrderStatus.Draft));
    }
}
