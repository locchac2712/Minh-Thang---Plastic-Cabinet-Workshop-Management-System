package com.pcwms.backend.dto.request;

import lombok.Data;

import java.math.BigDecimal;
@Data
public class SendApprovalRequest {
    private BigDecimal proposedCreditLimit;  // hạn mức tín dụng đề xuất
    private String     note;                 // ghi chú gửi kèm
}
