package com.tuplastic.erp.order.service;

import com.tuplastic.erp.activitylog.repository.ActivityLogRepository;
import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.common.exception.BadRequestException;
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
import com.tuplastic.erp.order.util.OrderDisplayCodeUtils;
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.product.repository.ProductRepository;
import com.tuplastic.erp.productinventory.repository.ProductInventoryLogRepository;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.reconcile.AgencyDebtComputationService;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.enums.UserRole;
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
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderSourceOrderIdTest {

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
    private AgencyDebtComputationService agencyDebtComputationService;

    @InjectMocks
    private OrderService orderService;

    @Test
    void createDraftOrder_withoutSourceOrderId_createsDraftQuotation() {
        UUID agencyId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Agency agency = Agency.builder().name("Test Agency").build();
        agency.setId(agencyId);

        Product product = catalogProduct(productId);

        CreateOrderRequest request = baseRequest(agencyId, productId, null, BigDecimal.valueOf(100), 1);

        when(agencyRepository.findByIdAndAssignedSellerId(agencyId, sellerId))
                .thenReturn(Optional.of(agency));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(orderRepository.nextQuotationNumberSeq()).thenReturn(1L);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderMapper.toResponse(any(Order.class))).thenReturn(OrderResponse.builder().build());

        orderService.createDraftOrder(request, seller);

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(captor.capture());
        assertEquals(OrderStatus.Draft, captor.getValue().getStatus());
        assertNull(captor.getValue().getSourceOrder());
    }

    @Test
    void createDraftOrder_withAlignedPricing_autoApproves() {
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
        when(orderRepository.nextOrderNumberSeq()).thenReturn(1L);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderMapper.toResponse(any(Order.class))).thenReturn(
                OrderResponse.builder().sourceOrderId(sourceId).status("Approved").build());

        orderService.createDraftOrder(request, seller);

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(captor.capture());
        Order saved = captor.getValue();
        assertEquals(OrderStatus.Approved, saved.getStatus());
        assertEquals(sourceId, saved.getSourceOrder().getId());
        assertEquals(approverId, saved.getApprover().getId());
        assertEquals(BigDecimal.valueOf(50), saved.getItems().get(0).getUnitCostAtTime());
    }

    @Test
    void createDraftOrder_withPriceChange_staysDraft() {
        UUID agencyId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID sourceId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Agency agency = Agency.builder().name("Test Agency").build();
        agency.setId(agencyId);

        Product product = catalogProduct(productId);

        OrderItem sourceLine = OrderItem.builder()
                .product(product)
                .quantity(10)
                .unitPrice(BigDecimal.valueOf(100))
                .unitCostAtTime(BigDecimal.TEN)
                .build();

        Order source = Order.builder()
                .agency(agency)
                .createdBy(seller)
                .status(OrderStatus.Approved)
                .discountAmount(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .quotationValidUntil(LocalDate.now().plusDays(7))
                .build();
        source.setId(sourceId);
        sourceLine.setOrder(source);
        source.getItems().add(sourceLine);

        CreateOrderRequest request = baseRequest(agencyId, productId, sourceId, BigDecimal.valueOf(99), 3);

        when(agencyRepository.findByIdAndAssignedSellerId(agencyId, sellerId))
                .thenReturn(Optional.of(agency));
        when(orderRepository.findByIdAndCreatedById(sourceId, sellerId)).thenReturn(Optional.of(source));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(orderRepository.nextOrderNumberSeq()).thenReturn(2L);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderMapper.toResponse(any(Order.class))).thenReturn(OrderResponse.builder().build());

        orderService.createDraftOrder(request, seller);

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(captor.capture());
        assertEquals(OrderStatus.Draft, captor.getValue().getStatus());
        assertNull(captor.getValue().getApprover());
    }

    @Test
    void createDraftOrder_rejectsExpiredSource() {
        UUID agencyId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID sourceId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Agency agency = Agency.builder().name("Test Agency").build();
        agency.setId(agencyId);

        Order source = Order.builder()
                .agency(agency)
                .createdBy(seller)
                .status(OrderStatus.Approved)
                .quotationValidUntil(LocalDate.now().minusDays(1))
                .build();
        source.setId(sourceId);

        CreateOrderRequest request = baseRequest(agencyId, productId, sourceId, BigDecimal.valueOf(100), 1);

        when(agencyRepository.findByIdAndAssignedSellerId(agencyId, sellerId))
                .thenReturn(Optional.of(agency));
        when(orderRepository.findByIdAndCreatedById(sourceId, sellerId)).thenReturn(Optional.of(source));

        assertThrows(BadRequestException.class, () -> orderService.createDraftOrder(request, seller));
    }

    @Test
    void createDraftOrder_rejectsDraftSource() {
        UUID agencyId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID sourceId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Agency agency = Agency.builder().name("Test Agency").build();
        agency.setId(agencyId);

        Order source = Order.builder()
                .agency(agency)
                .createdBy(seller)
                .status(OrderStatus.Draft)
                .build();
        source.setId(sourceId);

        CreateOrderRequest request = baseRequest(agencyId, productId, sourceId, BigDecimal.valueOf(100), 1);

        when(agencyRepository.findByIdAndAssignedSellerId(agencyId, sellerId))
                .thenReturn(Optional.of(agency));
        when(orderRepository.findByIdAndCreatedById(sourceId, sellerId)).thenReturn(Optional.of(source));

        assertThrows(BadRequestException.class, () -> orderService.createDraftOrder(request, seller));
    }

    @Test
    void pushProduction_rejectsTemplateWithoutSource() {
        UUID orderId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Order order = Order.builder()
                .status(OrderStatus.Approved)
                .build();
        order.setId(orderId);

        when(orderRepository.findByIdAndCreatedById(orderId, sellerId)).thenReturn(Optional.of(order));

        assertThrows(ResourceNotFoundException.class, () -> orderService.pushProduction(orderId.toString(), seller));

        verify(notificationService, never()).notifyRoles(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void pushProduction_allowsFulfillmentOrder() {
        UUID orderId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID sourceId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Agency agency = Agency.builder().name("Đại lý A").build();

        Order source = Order.builder().build();
        source.setId(sourceId);

        Order order = Order.builder()
                .status(OrderStatus.Approved)
                .sourceOrder(source)
                .agency(agency)
                .build();
        order.setId(orderId);

        when(orderRepository.findByIdAndCreatedById(orderId, sellerId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderMapper.toResponse(any(Order.class))).thenReturn(OrderResponse.builder().status("Producing").build());

        orderService.pushProduction(orderId.toString(), seller);

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(captor.capture());
        assertEquals(OrderStatus.Producing, captor.getValue().getStatus());

        verify(notificationService).notifyRoles(
                eq(Set.of(UserRole.PRODUCTION)),
                eq("ORDER_PUSHED_TO_PRODUCTION"),
                eq("Đơn mới cho xưởng"),
                eq(String.format(
                        "Seller đã đẩy đơn %s (%s) xuống sản xuất. Tạo lô tại Lệnh theo đơn.",
                        OrderDisplayCodeUtils.displayRef(null, orderId),
                        agency.getName())),
                eq("/production/tasks/by-order"),
                eq("order-push-production:" + orderId),
                eq(seller),
                isNull());
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
}
