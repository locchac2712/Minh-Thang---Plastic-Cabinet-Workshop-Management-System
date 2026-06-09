package com.tuplastic.erp.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicTaskTrackResponse {

    private String productName;
    private Integer quantity;
    private String status;
    private String expectedEndDate;
    private LocalDateTime completedAt;
    private LocalDateTime deliveredAt;
    /** Mã lô hiển thị (LSX-…). */
    private String taskDisplayCode;
    private String agencyDisplayName;
    /** Địa chỉ giao trên đơn (shipping). */
    private String orderShippingAddress;
    /** Điểm giao đã xác nhận khi seller deliver-batch. */
    private String deliveryAddress;
    private String deliveryProofImageUrl;
    /** Done và chưa giao. */
    private Boolean deliverable;
    private String orderStatus;
    private List<PublicActivityLogEntry> activityLogs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PublicActivityLogEntry {
        private String description;
        private String imageUrl;
        private LocalDateTime createdAt;
        private String userDisplayName;
    }
}
