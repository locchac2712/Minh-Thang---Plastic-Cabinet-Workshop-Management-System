package com.tuplastic.erp.payment.dto;

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
public class PaymentResponse {

    private UUID id;
    private UUID orderId;
    /** Mã hiển thị đơn gắn phiếu (DH-… / BG-…); null khi phiếu không gắn đơn. */
    private String orderDisplayCode;
    private UUID agencyId;
    private String agencyName;
    private BigDecimal amount;
    private String paymentMethod;
    private String proofImage;
    private String note;
    private String status;
    private LocalDateTime createdAt;
}
