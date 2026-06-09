package com.tuplastic.erp.director.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectorOrderPipelineRow {

    private UUID orderId;
    private String displayCode;
    /** Mã báo giá gốc (khi đơn tạo từ copy). */
    private String sourceDisplayCode;
    private String agencyName;
    private String sellerName;
    private String status;
    private BigDecimal totalPayable;
    private LocalDate expectedDeliveryDate;
    private LocalDateTime createdAt;

    private int orderedQty;
    private int batchedQty;
    private int deliveredQty;
    private int remainingToBatch;
    private int remainingToDeliver;

    private boolean fulfillmentComplete;
    private boolean deliveryLate;
    private long openTaskCount;
}
