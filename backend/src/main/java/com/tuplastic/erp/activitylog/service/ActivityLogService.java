package com.tuplastic.erp.activitylog.service;

import com.tuplastic.erp.activitylog.dto.ActivityLogResponse;
import com.tuplastic.erp.activitylog.dto.CreateActivityLogRequest;
import com.tuplastic.erp.activitylog.entity.ActivityLog;
import com.tuplastic.erp.activitylog.mapper.ActivityLogMapper;
import com.tuplastic.erp.activitylog.repository.ActivityLogRepository;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.order.dto.SellerOrderTaskTimelineResponse;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.production.entity.ProductionTask;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.production.service.ProductionTaskService;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final OrderRepository orderRepository;
    private final ProductionTaskRepository productionTaskRepository;
    private final ProductionTaskService productionTaskService;
    private final ActivityLogMapper activityLogMapper;

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getLogsByOrder(UUID orderId, User seller) {
        orderRepository.findByIdAndCreatedById(orderId, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        return activityLogRepository.findByOrderId(orderId)
                .stream()
                .map(activityLogMapper::toResponse)
                .toList();
    }

    /**
     * Các lệnh SX gắn đơn (theo thời tạo), mỗi lệnh kèm activity log xếp thời gian tăng dần.
     */
    @Transactional(readOnly = true)
    public List<SellerOrderTaskTimelineResponse> getProductionTasksWithLogsByOrder(UUID orderId, User seller) {
        orderRepository.findByIdAndCreatedById(orderId, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        return getProductionTasksWithLogsByOrderId(orderId);
    }

    @Transactional(readOnly = true)
    public List<SellerOrderTaskTimelineResponse> getProductionTasksWithLogsByOrderId(UUID orderId) {
        orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        return productionTaskRepository.findByOrder_IdOrderByCreatedAtAsc(orderId).stream()
                .map(this::buildTaskTimeline)
                .toList();
    }

    private SellerOrderTaskTimelineResponse buildTaskTimeline(ProductionTask task) {
        List<ActivityLogResponse> logs = activityLogRepository.findByTaskIdOrderByCreatedAtAsc(task.getId())
                .stream()
                .map(activityLogMapper::toResponse)
                .toList();

        Product product = task.getProduct();
        User assignee = task.getAssignedTo();

        return SellerOrderTaskTimelineResponse.builder()
                .taskId(task.getId())
                .displayCode(task.getDisplayCode())
                .orderItemId(task.getOrderItem() != null ? task.getOrderItem().getId() : null)
                .orderId(task.getOrder() != null ? task.getOrder().getId() : null)
                .productId(product != null ? product.getId() : null)
                .productName(product != null ? product.getName() : null)
                .quantity(task.getQuantity())
                .assignedToId(assignee != null ? assignee.getId() : null)
                .assignedToName(assignee != null ? assignee.getFullName() : null)
                .status(task.getStatus())
                .startDate(task.getStartDate())
                .expectedEndDate(task.getExpectedEndDate())
                .completedAt(task.getCompletedAt())
                .deliveredAt(task.getDeliveredAt())
                .deliveryAddress(task.getDeliveryAddress())
                .deliveryProofImageUrl(task.getDeliveryProofImageUrl())
                .deliverable("Done".equals(task.getStatus()) && task.getDeliveredAt() == null)
                .taskCreatedAt(task.getCreatedAt())
                .activityLogs(logs)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getLogsByTask(String idOrCode) {
        UUID taskId = productionTaskService.resolveTaskId(idOrCode);

        return activityLogRepository.findByTaskIdOrderByCreatedAtDesc(taskId)
                .stream()
                .map(activityLogMapper::toResponse)
                .toList();
    }

    @Transactional
    public ActivityLogResponse createLog(String idOrCode, CreateActivityLogRequest request, User worker) {
        ProductionTask task = productionTaskService.resolveTaskOrThrow(idOrCode);

        ActivityLog log = ActivityLog.builder()
                .task(task)
                .user(worker)
                .imageUrl(request.getImageUrl())
                .description(request.getDescription())
                .build();

        return activityLogMapper.toResponse(activityLogRepository.save(log));
    }
}
