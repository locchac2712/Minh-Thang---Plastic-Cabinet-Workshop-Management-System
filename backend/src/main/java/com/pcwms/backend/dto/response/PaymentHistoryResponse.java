package com.pcwms.backend.dto.response;

import com.pcwms.backend.entity.Payment;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter

public class PaymentHistoryResponse {
    private Long id;
    private BigDecimal amount;
    private LocalDateTime transactionDate;
    private String paymentMethod;
    private Long payosOrderCode;
    private String payosStatus;
    private LocalDateTime payosPaidAt;

    public PaymentHistoryResponse(Payment payment){
        this.id = payment.getId();
        this.amount = payment.getAmount();
        this.transactionDate = payment.getTransactionDate();
        this.paymentMethod = payment.getPaymentMethod();
        this.payosOrderCode = payment.getPayosOrderCode();
        this.payosStatus = payment.getPayosStatus();
        this.payosPaidAt = payment.getPayosPaidAt();
    }
}


