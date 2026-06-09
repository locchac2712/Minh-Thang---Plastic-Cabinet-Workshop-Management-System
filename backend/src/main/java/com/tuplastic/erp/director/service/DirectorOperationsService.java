package com.tuplastic.erp.director.service;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.BusinessLogicException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.activitylog.service.ActivityLogService;
import com.tuplastic.erp.director.dto.DirectorOrderPipelineRow;
import com.tuplastic.erp.director.dto.DirectorOrderWasteEventRow;
import com.tuplastic.erp.director.dto.DirectorOrderWasteSummaryResponse;
import com.tuplastic.erp.director.dto.DirectorWasteMaterialRow;
import com.tuplastic.erp.inventory.entity.InventoryLog;
import com.tuplastic.erp.inventory.repository.InventoryLogRepository;
import com.tuplastic.erp.material.entity.Material;
import com.tuplastic.erp.order.dto.OrderFulfillmentSummaryDto;
import com.tuplastic.erp.order.dto.SellerOrderTaskTimelineResponse;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.entity.OrderItem;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.repository.OrderItemRepository;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.order.service.OrderFulfillmentCalculator;
import com.tuplastic.erp.order.service.OrderFulfillmentService;
import com.tuplastic.erp.order.util.OrderPhaseUtils;
import com.tuplastic.erp.production.entity.ProductionTask;
import com.tuplastic.erp.production.dto.TaskResponse;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.production.service.ProductionTaskService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DirectorOperationsService {

    private static final List<OrderStatus> DEFAULT_PIPELINE_STATUSES =
            List.of(OrderStatus.Approved, OrderStatus.Producing, OrderStatus.Done);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductionTaskRepository productionTaskRepository;
    private final OrderFulfillmentCalculator fulfillmentCalculator;
    private final ActivityLogService activityLogService;
    private final OrderFulfillmentService orderFulfillmentService;
    private final ProductionTaskService productionTaskService;
    private final InventoryLogRepository inventoryLogRepository;

    private static final String QUOTATION_PHASE_MESSAGE =
            "Đơn đang ở giai đoạn báo giá — xem tại Phê duyệt";

    @Transactional(readOnly = true)
    public List<SellerOrderTaskTimelineResponse> getOrderProductionTasks(UUID orderId) {
        Order order = requireOperationsOrder(orderId);
        return activityLogService.getProductionTasksWithLogsByOrderId(order.getId());
    }

    @Transactional(readOnly = true)
    public OrderFulfillmentSummaryDto getOrderFulfillment(UUID orderId) {
        Order order = requireOperationsOrder(orderId);
        return orderFulfillmentService.buildSummary(order.getId());
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskDetail(String idOrCode) {
        return productionTaskService.getTaskDetail(idOrCode);
    }

    @Transactional(readOnly = true)
    public DirectorOrderWasteSummaryResponse getOrderWaste(UUID orderId) {
        Order order = requireOperationsOrder(orderId);
        List<InventoryLog> logs = inventoryLogRepository.findWasteLogsByOrderId(order.getId());

        BigDecimal totalDamage = BigDecimal.ZERO;
        BigDecimal boards = BigDecimal.ZERO;
        Map<UUID, DirectorWasteMaterialRow> materialAcc = new LinkedHashMap<>();
        List<DirectorOrderWasteEventRow> events = new ArrayList<>();

        for (InventoryLog log : logs) {
            BigDecimal qtyAbs = log.getQuantityChange() != null
                    ? log.getQuantityChange().abs()
                    : BigDecimal.ZERO;
            BigDecimal unitPrice = log.getUnitPriceAtTime() != null ? log.getUnitPriceAtTime() : BigDecimal.ZERO;
            BigDecimal lineDamage = qtyAbs.multiply(unitPrice).setScale(0, RoundingMode.HALF_UP);
            totalDamage = totalDamage.add(lineDamage);

            Material material = log.getMaterial();
            if (material != null && isBoardUnit(material.getUnit())) {
                boards = boards.add(qtyAbs);
            }

            if (material != null) {
                UUID materialId = material.getId();
                DirectorWasteMaterialRow existing = materialAcc.get(materialId);
                if (existing == null) {
                    materialAcc.put(materialId, DirectorWasteMaterialRow.builder()
                            .materialId(materialId)
                            .materialCode(material.getCode())
                            .materialName(material.getName())
                            .quantityAbs(qtyAbs)
                            .damageVnd(lineDamage)
                            .build());
                } else {
                    existing.setQuantityAbs(existing.getQuantityAbs().add(qtyAbs));
                    existing.setDamageVnd(existing.getDamageVnd().add(lineDamage));
                }
            }

            ProductionTask task = log.getTask();
            String productName = task != null && task.getProduct() != null ? task.getProduct().getName() : null;
            String assignedToName = task != null && task.getAssignedTo() != null
                    ? task.getAssignedTo().getFullName()
                    : null;

            events.add(DirectorOrderWasteEventRow.builder()
                    .logId(log.getId())
                    .taskId(task != null ? task.getId() : null)
                    .taskDisplayCode(task != null ? task.getDisplayCode() : null)
                    .productName(productName)
                    .assignedToName(assignedToName)
                    .materialCode(material != null ? material.getCode() : null)
                    .materialName(material != null ? material.getName() : null)
                    .quantityAbs(qtyAbs)
                    .damageVnd(lineDamage)
                    .note(log.getNote())
                    .createdAt(log.getCreatedAt())
                    .build());
        }

        List<DirectorWasteMaterialRow> materialRows = materialAcc.values().stream()
                .sorted(Comparator.comparing(DirectorWasteMaterialRow::getDamageVnd).reversed())
                .toList();

        return DirectorOrderWasteSummaryResponse.builder()
                .orderId(order.getId())
                .estimatedDamageVnd(totalDamage)
                .wasteEventCount(logs.size())
                .discardedBoardEquivalent(boards)
                .materialRows(materialRows)
                .events(events)
                .build();
    }

    private static boolean isBoardUnit(String unit) {
        if (unit == null) {
            return false;
        }
        String norm = unit.trim().toLowerCase();
        return "tấm".equals(norm) || "tam".equals(norm);
    }

    @Transactional(readOnly = true)
    public PageResponse<TaskResponse> getTasks(List<String> statuses, int page, int size) {
        return productionTaskService.getTasks(statuses, page, size);
    }

    private Order requireOperationsOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
        assertFulfillmentRecord(order);
        if (OrderPhaseUtils.isQuotationPhase(order.getStatus())) {
            throw new BusinessLogicException(QUOTATION_PHASE_MESSAGE);
        }
        if (!OrderPhaseUtils.isOperationsPhase(order.getStatus())) {
            throw new BusinessLogicException("Trạng thái đơn không hỗ trợ xem tiến độ vận hành");
        }
        return order;
    }

    private static void assertFulfillmentRecord(Order order) {
        if (order.getSourceOrder() == null) {
            throw new ResourceNotFoundException(
                    "Đơn hàng", "mã", order.getDisplayCode() != null ? order.getDisplayCode() : order.getId());
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<DirectorOrderPipelineRow> getOrderPipeline(List<OrderStatus> statuses,
                                                                    LocalDate fromDate,
                                                                    LocalDate toDate,
                                                                    boolean lateOnly,
                                                                    int page,
                                                                    int size) {
        List<OrderStatus> statusFilter = statuses != null && !statuses.isEmpty()
                ? statuses
                : DEFAULT_PIPELINE_STATUSES;

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orderPage = orderRepository.findAll(
                orderPipelineSpec(statusFilter, fromDate, toDate, lateOnly),
                pageable);

        List<Order> orders = orderPage.getContent();
        List<UUID> orderIds = orders.stream().map(Order::getId).toList();
        Map<UUID, List<OrderItem>> itemsByOrder = orderIds.isEmpty()
                ? Map.of()
                : orderItemRepository.findByOrder_IdInOrderByCreatedAtAsc(orderIds).stream()
                        .collect(Collectors.groupingBy(item -> item.getOrder().getId()));

        List<DirectorOrderPipelineRow> rows = orders.stream()
                .map(order -> toPipelineRow(order, itemsByOrder.getOrDefault(order.getId(), List.of())))
                .toList();

        return PageResponse.<DirectorOrderPipelineRow>builder()
                .content(rows)
                .page(orderPage.getNumber())
                .size(orderPage.getSize())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .last(orderPage.isLast())
                .build();
    }

    private DirectorOrderPipelineRow toPipelineRow(Order order, List<OrderItem> items) {
        OrderFulfillmentCalculator.Rollup rollup = fulfillmentCalculator.rollupForItems(items);
        LocalDate today = LocalDate.now();
        boolean deliveryLate = order.getStatus() != OrderStatus.Done
                && order.getExpectedDeliveryDate() != null
                && order.getExpectedDeliveryDate().isBefore(today);
        long openTasks = productionTaskRepository.countOpenTasksByOrderId(order.getId());
        Order sourceOrder = order.getSourceOrder();
        String sourceDisplayCode = sourceOrder != null ? sourceOrder.getDisplayCode() : null;

        return DirectorOrderPipelineRow.builder()
                .orderId(order.getId())
                .displayCode(order.getDisplayCode())
                .sourceDisplayCode(sourceDisplayCode)
                .agencyName(order.getAgency().getName())
                .sellerName(order.getCreatedBy() != null ? order.getCreatedBy().getFullName() : null)
                .status(order.getStatus().name())
                .totalPayable(order.getTotalPayable())
                .expectedDeliveryDate(order.getExpectedDeliveryDate())
                .createdAt(order.getCreatedAt())
                .orderedQty(rollup.getOrderedQty())
                .batchedQty(rollup.getBatchedQty())
                .deliveredQty(rollup.getDeliveredQty())
                .remainingToBatch(rollup.getRemainingToBatch())
                .remainingToDeliver(rollup.getRemainingToDeliver())
                .fulfillmentComplete(rollup.isFulfillmentComplete())
                .deliveryLate(deliveryLate)
                .openTaskCount(openTasks)
                .build();
    }

    private static Specification<Order> orderPipelineSpec(List<OrderStatus> statuses,
                                                           LocalDate fromDate,
                                                           LocalDate toDate,
                                                           boolean lateOnly) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(root.get("status").in(statuses));
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate.atStartOfDay()));
            }
            if (toDate != null) {
                predicates.add(cb.lessThan(root.get("createdAt"), toDate.plusDays(1).atStartOfDay()));
            }
            if (lateOnly) {
                LocalDate today = LocalDate.now();
                predicates.add(root.get("status").in(List.of(OrderStatus.Approved, OrderStatus.Producing)));
                predicates.add(cb.isNotNull(root.get("expectedDeliveryDate")));
                predicates.add(cb.lessThan(root.get("expectedDeliveryDate"), today));
            }
            predicates.add(cb.isNotNull(root.get("sourceOrder")));
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    public List<OrderStatus> defaultPipelineStatuses() {
        return DEFAULT_PIPELINE_STATUSES;
    }

    public List<OrderStatus> parsePipelineStatuses(String statusParam) {
        if (statusParam == null || statusParam.isBlank()) {
            return null;
        }
        EnumSet<OrderStatus> allowed = EnumSet.of(
                OrderStatus.Approved, OrderStatus.Producing, OrderStatus.Done);
        List<OrderStatus> parsed = new ArrayList<>();
        for (String part : statusParam.split(",")) {
            String s = part.trim();
            if (s.isEmpty()) {
                continue;
            }
            OrderStatus st = OrderStatus.valueOf(s);
            if (allowed.contains(st)) {
                parsed.add(st);
            }
        }
        return parsed.isEmpty() ? null : parsed;
    }
}
