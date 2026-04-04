package com.pcwms.backend.dto.request;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CustomerInteractionRequest {
    private Long customerId;
    private String type; // CALL, EMAIL, MEETING, NOTE, REMINDER
    private String content;
    private LocalDateTime interactionDate;
    private LocalDateTime reminderDate;
}
