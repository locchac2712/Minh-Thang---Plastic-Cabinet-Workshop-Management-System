package com.tuplastic.erp.activitylog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogResponse {

    private UUID id;
    private UUID taskId;
    private UUID userId;
    private String userName;
    private String imageUrl;
    private String description;
    private LocalDateTime createdAt;
}
