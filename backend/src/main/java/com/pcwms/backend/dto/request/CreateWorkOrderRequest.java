package com.pcwms.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Setter
@Getter
public class CreateWorkOrderRequest {
    private Long manufactureOrderId;
    private LocalDate executionDate;
    private String shift;
    private String techicalNotes;

    private List<WorkOrderItemRequest> items;

    @Getter
    @Setter
    public static class WorkOrderItemRequest {
        private Long productId;
        private Integer quantity;
    }
}
