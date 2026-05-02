package com.tuplastic.erp.order.dto;

import com.tuplastic.erp.activitylog.dto.ActivityLogResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Một lệnh SX thuộc đơn + toàn bộ activity log của lệnh (seller theo dõi tiến độ).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerOrderTaskTimelineResponse {

    private UUID taskId;
    private UUID orderId;
    private UUID productId;
    private String productName;
    private Integer quantity;
    private UUID assignedToId;
    private String assignedToName;
    private String status;
    private LocalDate startDate;
    private LocalDate expectedEndDate;
    private LocalDateTime completedAt;
    private LocalDateTime taskCreatedAt;
    private List<ActivityLogResponse> activityLogs;
}
