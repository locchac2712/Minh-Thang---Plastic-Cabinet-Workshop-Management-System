package com.tuplastic.erp.production.service;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.order.service.OrderService;
import com.tuplastic.erp.order.util.OrderDisplayCodeUtils;
import com.tuplastic.erp.production.dto.ProductionOrderDetailDto;
import com.tuplastic.erp.production.dto.ProductionOrderQueueItemDto;
import com.tuplastic.erp.production.repository.ProductionOrderQueueRow;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductionOrderQueueService {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Transactional(readOnly = true)
    public PageResponse<ProductionOrderQueueItemDto> listOrders(String statusParam,
                                                               Boolean awaitingBatch,
                                                               String search,
                                                               int page,
                                                               int size) {
        List<OrderStatus> statuses = resolveStatuses(statusParam);
        String searchTerm = normalizeSearch(search);
        Pageable pageable = PageRequest.of(page, size);
        Page<ProductionOrderQueueRow> rows = orderRepository.findProductionOrderQueue(
                statuses.stream().map(Enum::name).toList(),
                awaitingBatch,
                searchTerm,
                pageable);
        List<ProductionOrderQueueItemDto> content = rows.getContent().stream()
                .map(this::toQueueItem)
                .toList();
        return PageResponse.<ProductionOrderQueueItemDto>builder()
                .content(content)
                .page(rows.getNumber())
                .size(rows.getSize())
                .totalElements(rows.getTotalElements())
                .totalPages(rows.getTotalPages())
                .last(rows.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public ProductionOrderDetailDto getOrderDetail(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
        if (order.getSourceOrder() == null) {
            throw new ResourceNotFoundException("Đơn hàng", "id", orderId);
        }
        ProductionOrderQueueRow stats = orderRepository.findProductionOrderQueueStats(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
        return ProductionOrderDetailDto.builder()
                .orderId(order.getId())
                .orderDisplayCode(OrderDisplayCodeUtils.productionOrderDisplayCode(order.getDisplayCode()))
                .agencyName(order.getAgency().getName())
                .status(order.getStatus().name())
                .expectedDeliveryDate(order.getExpectedDeliveryDate())
                .createdAt(order.getCreatedAt())
                .shippingAddress(order.getShippingAddress())
                .totalPayable(order.getTotalPayable())
                .taskCount(stats.getTaskCount() != null ? stats.getTaskCount() : 0L)
                .remainingBatchableTotal(toInt(stats.getRemainingBatchableTotal()))
                .hasPendingBatch(toInt(stats.getRemainingBatchableTotal()) > 0)
                .build();
    }

    private List<OrderStatus> resolveStatuses(String statusParam) {
        List<OrderStatus> parsed = orderService.parseStatuses(statusParam);
        if (parsed == null || parsed.isEmpty()) {
            return List.of(OrderStatus.Producing);
        }
        return parsed;
    }

    private ProductionOrderQueueItemDto toQueueItem(ProductionOrderQueueRow row) {
        int remaining = toInt(row.getRemainingBatchableTotal());
        return ProductionOrderQueueItemDto.builder()
                .orderId(row.getOrderId())
                .orderDisplayCode(OrderDisplayCodeUtils.productionOrderDisplayCode(row.getOrderDisplayCode()))
                .agencyName(row.getAgencyName())
                .expectedDeliveryDate(row.getExpectedDeliveryDate())
                .createdAt(row.getCreatedAt())
                .taskCount(row.getTaskCount() != null ? row.getTaskCount() : 0L)
                .remainingBatchableTotal(remaining)
                .hasPendingBatch(remaining > 0)
                .build();
    }

    private int toInt(Long value) {
        if (value == null) {
            return 0;
        }
        return value.intValue();
    }

    private String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        return search.trim();
    }
}
