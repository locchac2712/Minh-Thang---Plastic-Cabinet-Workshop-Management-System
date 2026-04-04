package com.pcwms.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class CustomerInteractionResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private Long staffId;
    private String staffName;
    private String type;
    private String content;
    private LocalDateTime interactionDate;
    private LocalDateTime reminderDate;
    private boolean isResolved;
}
