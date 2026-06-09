package com.tuplastic.erp.production.service;

import com.tuplastic.erp.activitylog.repository.ActivityLogRepository;
import com.tuplastic.erp.bom.entity.BomItem;
import com.tuplastic.erp.bom.repository.BomItemRepository;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.BusinessLogicException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.inventory.entity.InventoryLog;
import com.tuplastic.erp.inventory.repository.InventoryLogRepository;
import com.tuplastic.erp.material.entity.Material;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.mapper.OrderMapper;
import com.tuplastic.erp.order.util.OrderDisplayCodeUtils;
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.productinventory.entity.ProductInventoryLog;
import com.tuplastic.erp.productinventory.repository.ProductInventoryLogRepository;
import com.tuplastic.erp.production.dto.AssignTaskRequest;
import com.tuplastic.erp.production.dto.TaskResponse;
import com.tuplastic.erp.production.entity.ProductionTask;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.production.util.ProductionTaskDisplayCodeUtils;
import com.tuplastic.erp.product.repository.ProductRepository;
import com.tuplastic.erp.material.repository.MaterialRepository;
import com.tuplastic.erp.notification.service.NotificationService;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ProductionTaskService {

    private final ProductionTaskRepository taskRepository;
    private final ActivityLogRepository activityLogRepository;
    private final BomItemRepository bomItemRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final ProductInventoryLogRepository productInventoryLogRepository;
    private final ProductRepository productRepository;
    private final MaterialRepository materialRepository;
    private final UserRepository userRepository;
    private final OrderMapper orderMapper;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public PageResponse<TaskResponse> getTasks(List<String> statuses, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ProductionTask> taskPage = taskRepository.findWithFilters(statuses, pageable);

        return PageResponse.<TaskResponse>builder()
                .content(taskPage.getContent().stream().map(this::toBasicResponse).toList())
                .page(taskPage.getNumber())
                .size(taskPage.getSize())
                .totalElements(taskPage.getTotalElements())
                .totalPages(taskPage.getTotalPages())
                .last(taskPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> listTasksByOrder(UUID orderId) {
        return taskRepository.findByOrder_IdOrderByCreatedAtAsc(orderId).stream()
                .map(this::toBasicResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskDetail(String idOrCode) {
        ProductionTask task = resolveTaskOrThrow(idOrCode);
        TaskResponse response = toBasicResponse(task);

        if (task.getOrder() != null) {
            Order order = task.getOrder();
            response.setOrderItems(
                    order.getItems().stream().map(orderMapper::toItemResponse).toList()
            );
        }

        List<TaskResponse.BomItemDetail> allBom = new ArrayList<>();

        if (task.getProduct() != null) {
            List<BomItem> bomItems = bomItemRepository.findByProductIdOrderByCreatedAtAsc(
                    task.getProduct().getId());
            for (BomItem bom : bomItems) {
                allBom.add(toBomDetail(bom.getMaterial(), bom.getQuantity()));
            }
        }

        response.setBomItems(allBom);
        return response;
    }

    @Transactional
    public TaskResponse assignTask(String idOrCode, AssignTaskRequest request) {
        ProductionTask task = resolveTaskOrThrow(idOrCode);

        User worker = userRepository.findById(request.getAssignedTo())
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", "id", request.getAssignedTo()));

        task.setAssignedTo(worker);
        return toBasicResponse(taskRepository.save(task));
    }

    /**
     * Waiting → Doing. AUTO-BOM: trừ kho NVL theo công thức BOM của {@link ProductionTask#getProduct()}.
     */
    @Transactional
    public TaskResponse startTask(String idOrCode, User currentUser) {
        ProductionTask task = resolveTaskOrThrow(idOrCode);
        assertTaskStatus(task, "Waiting", "bắt đầu thi công");

        deductBomMaterials(task, currentUser);

        task.setStatus("Doing");
        task.setStartDate(LocalDate.now());
        return toBasicResponse(taskRepository.save(task));
    }

    /**
     * Doing → Done. Nhập kho thành phẩm (MTO và make-to-stock); Seller {@code markDone} sẽ xuất kho khi giao đơn MTO.
     */
    @Transactional
    public TaskResponse completeTask(String idOrCode, User currentUser) {
        ProductionTask task = resolveTaskOrThrow(idOrCode);
        assertTaskStatus(task, "Doing", "hoàn tất");

        if (activityLogRepository.countByTaskId(task.getId()) < 1) {
            throw new BadRequestException(
                    "Cần ít nhất một nhật ký làm việc của lệnh trước khi hoàn tất.");
        }

        task.setStatus("Done");
        task.setCompletedAt(LocalDateTime.now());

        if (task.getProduct() != null) {
            importFinishedGoods(task, currentUser);
        }

        ProductionTask saved = taskRepository.save(task);

        Order order = saved.getOrder();
        if (order != null && order.getCreatedBy() != null) {
            String orderRef = OrderDisplayCodeUtils.displayRef(order.getDisplayCode(), order.getId());
            String batchRef = ProductionTaskDisplayCodeUtils.displayRef(
                    saved.getDisplayCode(), saved.getId());
            notificationService.notifyUser(
                    order.getCreatedBy(),
                    "PRODUCTION_BATCH_COMPLETED",
                    "Lô sản xuất đã hoàn thành",
                    String.format(
                            "Lô %s (SL %d) của đơn %s đã xong xưởng. Có thể giao lô qua deliver-batch.",
                            batchRef,
                            saved.getQuantity(),
                            orderRef),
                    "/seller/orders/" + orderRef,
                    "production-batch-completed:" + saved.getId(),
                    currentUser,
                    null);
        }

        return toBasicResponse(saved);
    }

    // ========== AUTO-BOM logic ==========

    private void deductBomMaterials(ProductionTask task, User currentUser) {
        if (task.getProduct() == null) {
            throw new BadRequestException("Lệnh sản xuất không gắn sản phẩm — không thể trừ BOM.");
        }

        Map<UUID, BigDecimal> totalDeductions = new HashMap<>();
        collectStandardBom(task.getProduct(), task.getQuantity(), totalDeductions);

        if (totalDeductions.isEmpty()) return;

        for (Map.Entry<UUID, BigDecimal> entry : totalDeductions.entrySet()) {
            Material material = materialRepository.findById(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Vật tư", "id", entry.getKey()));

            BigDecimal needed = entry.getValue();
            if (material.getStockQuantity().compareTo(needed) < 0) {
                throw new BusinessLogicException(
                        String.format("Kho không đủ vật tư '%s' (%s). Cần: %s, Có: %s. Liên hệ Kế toán nhập thêm.",
                                material.getName(), material.getCode(),
                                needed.toPlainString(), material.getStockQuantity().toPlainString()));
            }

            material.setStockQuantity(material.getStockQuantity().subtract(needed));
            materialRepository.save(material);

            InventoryLog log = InventoryLog.builder()
                    .material(material)
                    .task(task)
                    .createdBy(currentUser)
                    .transactionType("EXPORT")
                    .quantityChange(needed.negate())
                    .unitPriceAtTime(material.getUnitCost())
                    .note("AUTO-BOM: Xuất kho cho lệnh SX " + ProductionTaskDisplayCodeUtils.displayRef(task.getDisplayCode(), task.getId()))
                    .build();
            inventoryLogRepository.save(log);
        }
    }

    private void collectStandardBom(Product product, int quantity, Map<UUID, BigDecimal> deductions) {
        List<BomItem> bomItems = bomItemRepository.findByProductIdOrderByCreatedAtAsc(product.getId());
        for (BomItem bom : bomItems) {
            BigDecimal needed = bom.getQuantity().multiply(BigDecimal.valueOf(quantity));
            deductions.merge(bom.getMaterial().getId(), needed, BigDecimal::add);
        }
    }

    // ========== AUTO-ROUTING logic ==========

    private void importFinishedGoods(ProductionTask task, User currentUser) {
        Product product = task.getProduct();
        int qty = task.getQuantity();

        product.setStockQuantity(product.getStockQuantity() + qty);
        productRepository.save(product);

        String note = task.getOrder() != null
                ? "MTO: Nhập kho TP sau hoàn thành lệnh SX #" + task.getId().toString().substring(0, 8)
                : "Make-to-Stock: Nhập kho từ lệnh SX #" + task.getId().toString().substring(0, 8);

        ProductInventoryLog log = ProductInventoryLog.builder()
                .product(product)
                .order(task.getOrder())
                .task(task)
                .createdBy(currentUser)
                .transactionType("IMPORT")
                .quantityChange(qty)
                .note(note)
                .build();
        productInventoryLogRepository.save(log);
    }

    // ========== Helpers ==========

    @Transactional(readOnly = true)
    public ProductionTask resolveTaskOrThrow(String idOrCode) {
        if (idOrCode == null || idOrCode.isBlank()) {
            throw new BadRequestException("Mã lệnh không được để trống.");
        }
        String trimmed = idOrCode.trim();
        UUID uuid = ProductionTaskDisplayCodeUtils.parseUuid(trimmed);
        if (uuid != null) {
            return findTaskOrThrow(uuid);
        }
        return taskRepository.findByDisplayCode(trimmed)
                .orElseThrow(() -> new ResourceNotFoundException("Lệnh sản xuất", "mã", trimmed));
    }

    @Transactional(readOnly = true)
    public UUID resolveTaskId(String idOrCode) {
        return resolveTaskOrThrow(idOrCode).getId();
    }

    private ProductionTask findTaskOrThrow(UUID id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lệnh sản xuất", "id", id));
    }

    private void assertTaskStatus(ProductionTask task, String expected, String action) {
        if (!task.getStatus().equals(expected)) {
            throw new BadRequestException(
                    String.format("Không thể %s: lệnh đang ở trạng thái '%s', yêu cầu '%s'",
                            action, task.getStatus(), expected));
        }
    }

    private TaskResponse.BomItemDetail toBomDetail(Material material, BigDecimal quantityPerUnit) {
        return TaskResponse.BomItemDetail.builder()
                .materialId(material.getId())
                .materialName(material.getName())
                .materialCode(material.getCode())
                .unit(material.getUnit())
                .quantityPerUnit(quantityPerUnit)
                .build();
    }

    private TaskResponse toBasicResponse(ProductionTask task) {
        return toTaskResponse(task);
    }

    public TaskResponse toTaskResponse(ProductionTask task) {
        TaskResponse.TaskResponseBuilder builder = TaskResponse.builder()
                .id(task.getId())
                .displayCode(task.getDisplayCode())
                .orderItemId(task.getOrderItem() != null ? task.getOrderItem().getId() : null)
                .productId(task.getProduct() != null ? task.getProduct().getId() : null)
                .productName(task.getProduct() != null ? task.getProduct().getName() : null)
                .quantity(task.getQuantity())
                .assignedToId(task.getAssignedTo() != null ? task.getAssignedTo().getId() : null)
                .assignedToName(task.getAssignedTo() != null ? task.getAssignedTo().getFullName() : null)
                .status(task.getStatus())
                .startDate(task.getStartDate())
                .expectedEndDate(task.getExpectedEndDate())
                .completedAt(task.getCompletedAt())
                .deliveredAt(task.getDeliveredAt())
                .deliveryAddress(task.getDeliveryAddress())
                .deliveryProofImageUrl(task.getDeliveryProofImageUrl())
                .deliverable("Done".equals(task.getStatus()) && task.getDeliveredAt() == null)
                .createdAt(task.getCreatedAt());

        applyOverdueFields(builder, task);

        if (task.getOrder() != null) {
            builder.orderId(task.getOrder().getId())
                    .orderDisplayCode(OrderDisplayCodeUtils.productionOrderDisplayCode(
                            task.getOrder().getDisplayCode()))
                    .orderAgencyName(task.getOrder().getAgency() != null ? task.getOrder().getAgency().getName() : null);
        }

        if (task.getProduct() != null) {
            builder.productIsCustom(task.getProduct().getIsCustom())
                    .productResourceUrl(task.getProduct().getResourceUrl());
        }

        return builder.build();
    }

    private void applyOverdueFields(TaskResponse.TaskResponseBuilder builder, ProductionTask task) {
        LocalDate expected = task.getExpectedEndDate();
        if (expected == null) {
            builder.overdue(false).overdueDays(null);
            return;
        }
        if ("Done".equals(task.getStatus())) {
            LocalDateTime completedAt = task.getCompletedAt();
            if (completedAt == null) {
                builder.overdue(false).overdueDays(null);
                return;
            }
            LocalDate completed = completedAt.toLocalDate();
            if (completed.isAfter(expected)) {
                int days = (int) ChronoUnit.DAYS.between(expected, completed);
                builder.overdue(true).overdueDays(days);
            } else {
                builder.overdue(false).overdueDays(0);
            }
            return;
        }
        LocalDate today = LocalDate.now();
        if (expected.isBefore(today)) {
            int days = (int) ChronoUnit.DAYS.between(expected, today);
            builder.overdue(true).overdueDays(days);
        } else {
            builder.overdue(false).overdueDays(0);
        }
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getMyOpenTasks(User user, int limit) {
        return taskRepository.findOpenTasksForAssignee(user.getId(), PageRequest.of(0, limit)).stream()
                .map(this::toBasicResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getTaskCountByStatus() {
        Map<String, Long> map = new LinkedHashMap<>();
        for (Object[] row : taskRepository.countGroupByStatus()) {
            String status = (String) row[0];
            long cnt = ((Number) row[1]).longValue();
            map.put(status, cnt);
        }
        return map;
    }

    public List<String> parseStatuses(String statusParam) {
        if (statusParam == null || statusParam.isBlank()) return null;
        return Arrays.stream(statusParam.split(","))
                .map(String::trim)
                .toList();
    }
}
