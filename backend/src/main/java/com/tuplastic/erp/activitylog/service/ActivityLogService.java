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

        return productionTaskRepository.findByOrder_IdOrderByCreatedAtAsc(orderId).stream()
                .map(this::toSellerTaskTimeline)
                .toList();
    }

    private SellerOrderTaskTimelineResponse toSellerTaskTimeline(ProductionTask task) {
        List<ActivityLogResponse> logs = activityLogRepository.findByTaskIdOrderByCreatedAtAsc(task.getId())
                .stream()
                .map(activityLogMapper::toResponse)
                .toList();

        Product product = task.getProduct();
        User assignee = task.getAssignedTo();

        return SellerOrderTaskTimelineResponse.builder()
                .taskId(task.getId())
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
                .taskCreatedAt(task.getCreatedAt())
                .activityLogs(logs)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getLogsByTask(UUID taskId) {
        productionTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Lệnh sản xuất", "id", taskId));

        return activityLogRepository.findByTaskIdOrderByCreatedAtDesc(taskId)
                .stream()
                .map(activityLogMapper::toResponse)
                .toList();
    }

    @Transactional
    public ActivityLogResponse createLog(UUID taskId, CreateActivityLogRequest request, User worker) {
        ProductionTask task = productionTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Lệnh sản xuất", "id", taskId));

        ActivityLog log = ActivityLog.builder()
                .task(task)
                .user(worker)
                .imageUrl(request.getImageUrl())
                .description(request.getDescription())
                .build();

        return activityLogMapper.toResponse(activityLogRepository.save(log));
    }
}
