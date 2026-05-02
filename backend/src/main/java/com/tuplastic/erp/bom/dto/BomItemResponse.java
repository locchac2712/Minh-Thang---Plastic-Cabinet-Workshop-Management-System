package com.tuplastic.erp.bom.dto;

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
public class BomItemResponse {

    private UUID id;
    private UUID productId;
    private UUID materialId;
    private String materialCode;
    private String materialName;
    private String materialUnit;
    private BigDecimal quantity;
    private String note;
    private LocalDateTime createdAt;
}
