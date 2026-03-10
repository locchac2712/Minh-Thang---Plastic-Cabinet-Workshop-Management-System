package com.pcwms.backend.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class BomDetailRequest {
    private Long materialId; // ID của Gỗ, Đinh, Keo...
    private BigDecimal quantityRequired; // Cần bao nhiêu?
}