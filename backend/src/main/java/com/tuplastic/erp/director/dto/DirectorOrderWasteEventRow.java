package com.tuplastic.erp.director.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectorOrderWasteEventRow {

    private UUID logId;
    private UUID taskId;
    private String taskDisplayCode;
    private String productName;
    private String assignedToName;
    private String materialCode;
    private String materialName;
    private BigDecimal quantityAbs;
    private BigDecimal damageVnd;
    private String note;
    private LocalDateTime createdAt;
}
