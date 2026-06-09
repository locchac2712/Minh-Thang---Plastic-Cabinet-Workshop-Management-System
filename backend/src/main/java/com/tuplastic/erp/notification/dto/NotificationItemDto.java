package com.tuplastic.erp.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class NotificationItemDto {

    private UUID id;
    private String type;
    private String title;
    private String body;
    private String targetUrl;
    private String metaJson;
    private LocalDateTime createdAt;
    @JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime readAt;
}
