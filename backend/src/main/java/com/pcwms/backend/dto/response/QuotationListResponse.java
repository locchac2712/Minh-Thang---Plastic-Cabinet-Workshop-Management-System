package com.pcwms.backend.dto.response;

import com.pcwms.backend.entity.Quotation;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class QuotationListResponse {
    private Long id;
    private String quotationNumber;
    private String customerName;
    private String staffName;
    private BigDecimal totalAmount;
    private String status;
    private String rejectionReason;
    private LocalDateTime createdDate;
    private LocalDateTime validUntil;

    public QuotationListResponse(Quotation q) {
        this.id = q.getId();
        this.quotationNumber = q.getQuotationNumber();
        this.customerName = q.getCustomer().getName();
        this.staffName = q.getStaff().getFullName();
        this.totalAmount = q.getTotalAmount();
        this.status = q.getStatus();
        this.rejectionReason = q.getRejectionReason();
        this.createdDate = q.getCreatedDate();
        this.validUntil = q.getValidUntil();
    }
}
