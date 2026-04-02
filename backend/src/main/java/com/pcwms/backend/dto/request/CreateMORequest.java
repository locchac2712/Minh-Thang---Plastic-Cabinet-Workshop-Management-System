package com.pcwms.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CreateMORequest {
    private Long salesOrderId;
    private Long productId;
    private Integer quantity;
    private String technicalNotes;
    private LocalDateTime requestedStartDate;
    private LocalDateTime requestedEndDate;
    
}