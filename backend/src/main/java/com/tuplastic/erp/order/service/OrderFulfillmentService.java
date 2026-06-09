package com.tuplastic.erp.order.service;

import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.order.dto.OrderFulfillmentSummaryDto;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.entity.OrderItem;
import com.tuplastic.erp.order.repository.OrderItemRepository;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderFulfillmentService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductionTaskRepository productionTaskRepository;

    @Transactional(readOnly = true)
    public OrderFulfillmentSummaryDto buildSummary(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
        List<OrderItem> items = orderItemRepository.findByOrderIdOrderByCreatedAtAsc(orderId);

        List<OrderFulfillmentSummaryDto.FulfillmentLineDto> lines = items.stream()
                .map(this::toLine)
                .toList();

        return OrderFulfillmentSummaryDto.builder()
                .orderId(orderId)
                .status(order.getStatus().name())
                .lines(lines)
                .build();
    }

    private OrderFulfillmentSummaryDto.FulfillmentLineDto toLine(OrderItem item) {
        int batched = productionTaskRepository.sumQuantityByOrderItemId(item.getId());
        int delivered = item.getDeliveredQuantity() != null ? item.getDeliveredQuantity() : 0;
        int ordered = item.getQuantity() != null ? item.getQuantity() : 0;
        return OrderFulfillmentSummaryDto.FulfillmentLineDto.builder()
                .orderItemId(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .orderedQuantity(ordered)
                .batchedQuantity(batched)
                .deliveredQuantity(delivered)
                .remainingToBatch(Math.max(0, ordered - batched))
                .remainingToDeliver(Math.max(0, ordered - delivered))
                .build();
    }
}
