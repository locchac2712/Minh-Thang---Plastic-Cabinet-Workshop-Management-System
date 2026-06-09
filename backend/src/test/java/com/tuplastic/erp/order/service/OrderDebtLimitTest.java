package com.tuplastic.erp.order.service;

import com.tuplastic.erp.activitylog.repository.ActivityLogRepository;
import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.common.exception.BusinessLogicException;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderDebtLimitTest {

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
    @Mock
    private com.tuplastic.erp.reconcile.AgencyDebtComputationService agencyDebtComputationService;

    @InjectMocks
    private OrderService orderService;

    @org.junit.jupiter.api.BeforeEach
    void defaultComputedDebtZero() {
        when(agencyDebtComputationService.computeForAgency(any())).thenReturn(BigDecimal.ZERO);
    }

    @Test
    void submitOrder_quotationOverDebtLimit_doesNotBlock() {
        UUID orderId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID agencyId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Agency agency = overLimitAgency(agencyId);

        Order order = Order.builder()
                .agency(agency)
                .createdBy(seller)
                .status(OrderStatus.Draft)
                .totalAmount(BigDecimal.valueOf(100_000_000))
                .totalPayable(BigDecimal.valueOf(100_000_000))
                .discountAmount(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .paidAmount(BigDecimal.ZERO)
                .build();
        order.setId(orderId);

        when(orderRepository.findByIdAndCreatedById(orderId, sellerId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderMapper.toResponse(any(Order.class))).thenReturn(OrderResponse.builder().status("Pending").build());

        orderService.submitOrder(orderId.toString(), seller);

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(captor.capture());
        assertEquals(OrderStatus.Pending, captor.getValue().getStatus());
    }

    @Test
    void createDraftOrder_fulfillmentCopyOverDebtLimit_throws() {
        UUID agencyId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID sourceId = UUID.randomUUID();
        UUID approverId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        User approver = User.builder().build();
        approver.setId(approverId);

        Agency agency = overLimitAgency(agencyId);

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
                .status(OrderStatus.Approved)
                .discountAmount(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .quotationValidUntil(LocalDate.now().plusDays(7))
                .build();
        source.setId(sourceId);
        sourceLine.setOrder(source);
        source.getItems().add(sourceLine);

        CreateOrderRequest request = baseRequest(agencyId, productId, sourceId, BigDecimal.valueOf(100), 15_000);

        when(agencyDebtComputationService.computeForAgency(agencyId)).thenReturn(new BigDecimal("49000000"));
        when(agencyRepository.findByIdAndAssignedSellerId(agencyId, sellerId))
                .thenReturn(Optional.of(agency));
        when(orderRepository.findByIdAndCreatedById(sourceId, sellerId)).thenReturn(Optional.of(source));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(orderRepository.nextOrderNumberSeq()).thenReturn(1L);

        assertThrows(BusinessLogicException.class, () -> orderService.createDraftOrder(request, seller));
    }

    @Test
    void submitOrder_fulfillmentDraftOverDebtLimit_throws() {
        UUID orderId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID agencyId = UUID.randomUUID();
        UUID sourceId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Agency agency = overLimitAgency(agencyId);

        Order source = Order.builder().build();
        source.setId(sourceId);

        Order order = Order.builder()
                .agency(agency)
                .createdBy(seller)
                .sourceOrder(source)
                .status(OrderStatus.Draft)
                .totalAmount(BigDecimal.valueOf(100_000_000))
                .totalPayable(BigDecimal.valueOf(100_000_000))
                .discountAmount(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .paidAmount(BigDecimal.ZERO)
                .build();
        order.setId(orderId);

        when(orderRepository.findByIdAndCreatedById(orderId, sellerId)).thenReturn(Optional.of(order));
        when(agencyDebtComputationService.computeForAgency(agencyId)).thenReturn(new BigDecimal("49000000"));

        assertThrows(BusinessLogicException.class, () -> orderService.submitOrder(orderId.toString(), seller));
    }

    @Test
    void submitOrder_fulfillmentDraftOverDebtLimit_usesComputedNotLedger() {
        UUID orderId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID agencyId = UUID.randomUUID();
        UUID sourceId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Agency agency = Agency.builder().name("Ledger skew").build();
        agency.setId(agencyId);
        agency.setTotalDebt(new BigDecimal("90000000"));
        agency.setMaxDebtLimit(new BigDecimal("50000000"));

        Order source = Order.builder().build();
        source.setId(sourceId);

        Order order = Order.builder()
                .agency(agency)
                .createdBy(seller)
                .sourceOrder(source)
                .status(OrderStatus.Draft)
                .totalAmount(new BigDecimal("10000000"))
                .totalPayable(new BigDecimal("10000000"))
                .discountAmount(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .paidAmount(BigDecimal.ZERO)
                .build();
        order.setId(orderId);

        when(agencyDebtComputationService.computeForAgency(agencyId)).thenReturn(new BigDecimal("45000000"));
        when(orderRepository.findByIdAndCreatedById(orderId, sellerId)).thenReturn(Optional.of(order));

        assertThrows(BusinessLogicException.class, () -> orderService.submitOrder(orderId.toString(), seller));
    }

    @Test
    void submitOrder_blockedWhenComputedIncludesProducingOpenOrders() {
        UUID orderId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID agencyId = UUID.randomUUID();
        UUID sourceId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Agency agency = Agency.builder().name("Producing exposure").build();
        agency.setId(agencyId);
        agency.setTotalDebt(BigDecimal.ZERO);
        agency.setMaxDebtLimit(new BigDecimal("21000000"));

        Order source = Order.builder().build();
        source.setId(sourceId);

        Order order = Order.builder()
                .agency(agency)
                .createdBy(seller)
                .sourceOrder(source)
                .status(OrderStatus.Draft)
                .totalAmount(new BigDecimal("5000000"))
                .totalPayable(new BigDecimal("5000000"))
                .discountAmount(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .paidAmount(BigDecimal.ZERO)
                .build();
        order.setId(orderId);

        when(agencyDebtComputationService.computeForAgency(agencyId)).thenReturn(new BigDecimal("17000000"));
        when(orderRepository.findByIdAndCreatedById(orderId, sellerId)).thenReturn(Optional.of(order));

        assertThrows(BusinessLogicException.class, () -> orderService.submitOrder(orderId.toString(), seller));
    }

    private static Agency overLimitAgency(UUID agencyId) {
        Agency agency = Agency.builder().name("Over Limit Agency").build();
        agency.setId(agencyId);
        agency.setTotalDebt(new BigDecimal("49000000"));
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
}
