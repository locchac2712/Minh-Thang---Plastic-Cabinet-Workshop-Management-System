package com.tuplastic.erp.order.service;

import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.activitylog.repository.ActivityLogRepository;
import com.tuplastic.erp.invoice.repository.InvoiceRepository;
import com.tuplastic.erp.notification.service.NotificationService;
import com.tuplastic.erp.common.exception.BadRequestException;
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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderQuotationValidUntilTest {

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
    void createDraftOrder_persistsQuotationValidUntil() {
        UUID agencyId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID sourceId = UUID.randomUUID();
        LocalDate validUntil = LocalDate.of(2026, 6, 30);

        User seller = User.builder().build();
        seller.setId(sellerId);

        Agency agency = Agency.builder().name("Test Agency").build();
        agency.setId(agencyId);
        agency.setTotalDebt(BigDecimal.ZERO);
        agency.setMaxDebtLimit(new BigDecimal("50000000"));

        Product product = Product.builder()
                .name("Tu")
                .sku("TU-1")
                .costPrice(BigDecimal.TEN)
                .isCustom(false)
                .build();
        product.setId(productId);

        OrderItem sourceLine = OrderItem.builder()
                .product(product)
                .quantity(1)
                .unitPrice(BigDecimal.valueOf(100))
                .unitCostAtTime(BigDecimal.TEN)
                .build();

        Order source = Order.builder()
                .agency(agency)
                .createdBy(seller)
                .status(OrderStatus.Approved)
                .discountAmount(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .quotationValidUntil(validUntil)
                .build();
        source.setId(sourceId);
        sourceLine.setOrder(source);
        source.getItems().add(sourceLine);

        CreateOrderItemRequest itemReq = new CreateOrderItemRequest();
        itemReq.setProductId(productId);
        itemReq.setQuantity(1);
        itemReq.setUnitPrice(BigDecimal.valueOf(100));

        CreateOrderRequest request = new CreateOrderRequest();
        request.setAgencyId(agencyId);
        request.setSourceOrderId(sourceId);
        request.setQuotationValidUntil(validUntil);
        request.setDiscountAmount(BigDecimal.ZERO);
        request.setShippingFee(BigDecimal.ZERO);
        request.setItems(List.of(itemReq));

        when(agencyRepository.findByIdAndAssignedSellerId(agencyId, sellerId))
                .thenReturn(Optional.of(agency));
        when(orderRepository.findByIdAndCreatedById(sourceId, sellerId)).thenReturn(Optional.of(source));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(orderRepository.nextOrderNumberSeq()).thenReturn(1L);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderMapper.toResponse(any(Order.class))).thenReturn(
                OrderResponse.builder().quotationValidUntil(validUntil).build());

        orderService.createDraftOrder(request, seller);

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(captor.capture());
        assertEquals(validUntil, captor.getValue().getQuotationValidUntil());
    }

    @Test
    void updateDraftOrder_clearsQuotationValidUntilWhenNull() {
        UUID orderId = UUID.randomUUID();
        UUID agencyId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Agency agency = Agency.builder().name("Test Agency").build();
        agency.setId(agencyId);

        Product product = Product.builder()
                .name("Tu")
                .sku("TU-1")
                .costPrice(BigDecimal.TEN)
                .isCustom(false)
                .build();
        product.setId(productId);

        Order order = Order.builder()
                .agency(agency)
                .createdBy(seller)
                .status(OrderStatus.Draft)
                .quotationValidUntil(LocalDate.of(2026, 1, 1))
                .build();
        order.setId(orderId);

        CreateOrderItemRequest updateItemReq = new CreateOrderItemRequest();
        updateItemReq.setProductId(productId);
        updateItemReq.setQuantity(1);
        updateItemReq.setUnitPrice(BigDecimal.valueOf(100));

        CreateOrderRequest request = new CreateOrderRequest();
        request.setAgencyId(agencyId);
        request.setQuotationValidUntil(null);
        request.setItems(List.of(updateItemReq));

        when(orderRepository.findByIdAndCreatedById(orderId, sellerId)).thenReturn(Optional.of(order));
        when(agencyRepository.findByIdAndAssignedSellerId(agencyId, sellerId))
                .thenReturn(Optional.of(agency));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderMapper.toResponse(any(Order.class))).thenReturn(OrderResponse.builder().build());

        orderService.updateDraftOrder(orderId.toString(), request, seller);

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(captor.capture());
        assertNull(captor.getValue().getQuotationValidUntil());
    }

    @Test
    void createDraftOrder_rejectsPastQuotationValidUntil() {
        UUID agencyId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Agency agency = Agency.builder().name("Test Agency").build();
        agency.setId(agencyId);

        CreateOrderRequest request = new CreateOrderRequest();
        request.setAgencyId(agencyId);
        request.setQuotationValidUntil(LocalDate.now().minusDays(1));
        request.setItems(List.of());

        when(agencyRepository.findByIdAndAssignedSellerId(agencyId, sellerId))
                .thenReturn(Optional.of(agency));

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> orderService.createDraftOrder(request, seller));
        assertEquals("Hạn báo giá không được là ngày trong quá khứ.", ex.getMessage());
    }

    @Test
    void updateDraftOrder_rejectsPastQuotationValidUntil() {
        UUID orderId = UUID.randomUUID();
        UUID agencyId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();

        User seller = User.builder().build();
        seller.setId(sellerId);

        Agency agency = Agency.builder().name("Test Agency").build();
        agency.setId(agencyId);

        Order order = Order.builder()
                .agency(agency)
                .createdBy(seller)
                .status(OrderStatus.Draft)
                .build();
        order.setId(orderId);

        CreateOrderRequest request = new CreateOrderRequest();
        request.setAgencyId(agencyId);
        request.setQuotationValidUntil(LocalDate.now().minusDays(2));
        request.setItems(List.of());

        when(orderRepository.findByIdAndCreatedById(orderId, sellerId)).thenReturn(Optional.of(order));

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> orderService.updateDraftOrder(orderId.toString(), request, seller));
        assertEquals("Hạn báo giá không được là ngày trong quá khứ.", ex.getMessage());
    }
}
