package com.tuplastic.erp.production.service;

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
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.productinventory.entity.ProductInventoryLog;
import com.tuplastic.erp.productinventory.repository.ProductInventoryLogRepository;
import com.tuplastic.erp.production.dto.AssignTaskRequest;
import com.tuplastic.erp.production.dto.TaskResponse;
import com.tuplastic.erp.production.entity.ProductionTask;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.product.repository.ProductRepository;
import com.tuplastic.erp.material.repository.MaterialRepository;
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
import java.util.*;

@Service
@RequiredArgsConstructor
public class ProductionTaskService {

    private final ProductionTaskRepository taskRepository;
    private final BomItemRepository bomItemRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final ProductInventoryLogRepository productInventoryLogRepository;
    private final ProductRepository productRepository;
    private final MaterialRepository materialRepository;
    private final UserRepository userRepository;
    private final OrderMapper orderMapper;

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
    public TaskResponse getTaskDetail(UUID taskId) {
        ProductionTask task = findTaskOrThrow(taskId);
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
    public TaskResponse assignTask(UUID taskId, AssignTaskRequest request) {
        ProductionTask task = findTaskOrThrow(taskId);

        User worker = userRepository.findById(request.getAssignedTo())
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", "id", request.getAssignedTo()));

        task.setAssignedTo(worker);
        return toBasicResponse(taskRepository.save(task));
    }

    /**
     * Waiting → Doing. AUTO-BOM: trừ kho NVL theo công thức BOM của {@link ProductionTask#getProduct()}.
     */
    @Transactional
    public TaskResponse startTask(UUID taskId, User currentUser) {
        ProductionTask task = findTaskOrThrow(taskId);
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
    public TaskResponse completeTask(UUID taskId, User currentUser) {
        ProductionTask task = findTaskOrThrow(taskId);
        assertTaskStatus(task, "Doing", "hoàn tất");

        task.setStatus("Done");
        task.setCompletedAt(LocalDateTime.now());

        if (task.getProduct() != null) {
            importFinishedGoods(task, currentUser);
        }

        return toBasicResponse(taskRepository.save(task));
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
                    .note("AUTO-BOM: Xuất kho cho lệnh SX #" + task.getId().toString().substring(0, 8))
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
        TaskResponse.TaskResponseBuilder builder = TaskResponse.builder()
                .id(task.getId())
                .productId(task.getProduct() != null ? task.getProduct().getId() : null)
                .productName(task.getProduct() != null ? task.getProduct().getName() : null)
                .quantity(task.getQuantity())
                .assignedToId(task.getAssignedTo() != null ? task.getAssignedTo().getId() : null)
                .assignedToName(task.getAssignedTo() != null ? task.getAssignedTo().getFullName() : null)
                .status(task.getStatus())
                .startDate(task.getStartDate())
                .expectedEndDate(task.getExpectedEndDate())
                .completedAt(task.getCompletedAt())
                .createdAt(task.getCreatedAt());

        if (task.getOrder() != null) {
            builder.orderId(task.getOrder().getId())
                    .orderAgencyName(task.getOrder().getAgency() != null ? task.getOrder().getAgency().getName() : null);
        }

        if (task.getProduct() != null) {
            builder.productIsCustom(task.getProduct().getIsCustom())
                    .productResourceUrl(task.getProduct().getResourceUrl());
        }

        return builder.build();
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
