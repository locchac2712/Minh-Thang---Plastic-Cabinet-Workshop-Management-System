package com.pcwms.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
public class ApprovalRequest {
    // true = Duyệt (Approve), false = Hủy (Reject)
    @JsonProperty("isApproved")
    private boolean isApproved;

    // Nếu Duyệt, Giám đốc chốt hạn mức mới là bao nhiêu?
    private BigDecimal newCreditLimit;

    // Ghi chú của sếp (VD: "Khách VIP, cho qua")
    private String approvalNote;
}