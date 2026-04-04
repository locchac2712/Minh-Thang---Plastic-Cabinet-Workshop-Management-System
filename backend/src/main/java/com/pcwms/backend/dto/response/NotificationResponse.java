package com.pcwms.backend.dto.response;

import com.pcwms.backend.entity.Notification;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class NotificationResponse {
    private Long id;
    private String title;
    private String message;
    private Long referenceId;
    private boolean isRead;
    private LocalDateTime createdAt;
    private String type;

    public NotificationResponse(Notification n) {
        this.id = n.getId();
        this.title = n.getTitle();
        this.message = n.getMessage();
        this.referenceId = n.getReferenceId();
        this.isRead = n.isRead();
        this.createdAt = n.getCreatedAt();
        this.type = n.getType();
    }
}
