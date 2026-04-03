package com.pcwms.backend.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SalesOrderDetailRequest {
    private Long productId;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal discount;
    private String notes;
}
