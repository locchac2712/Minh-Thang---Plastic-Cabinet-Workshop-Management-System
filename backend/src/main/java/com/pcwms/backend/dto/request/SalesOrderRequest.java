package com.pcwms.backend.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class SalesOrderRequest {
    private Long customerId;
    private Long quotationId;
    private LocalDate dueDate;
    private String deliveryAddress;
    private String notes;
    private String paymentTerms;
    private String paymentMethod;
    private BigDecimal depositRatio;
    private BigDecimal depositAmount;
    private List<SalesOrderDetailRequest> details;
}
