package com.pcwms.backend.dto.request;

import com.pcwms.backend.entity.TransactionType;
import java.util.List;

public class WarehouseTransactionRequest {

    private TransactionType type;
    private Long staffId;
    private String referenceId;
    private List<TransactionDetailRequest> details;

    public WarehouseTransactionRequest() {
    }

    // --- GETTER & SETTER CHO TỪNG BIẾN (CHUẨN 100%) ---

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public Long getStaffId() {
        return staffId;
    }

    public void setStaffId(Long staffId) {
        this.staffId = staffId;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }

    public List<TransactionDetailRequest> getDetails() {
        return details;
    }

    public void setDetails(List<TransactionDetailRequest> details) {
        this.details = details;
    }
}