package com.tuplastic.erp.purchase.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Danh sách PO (kế toán): không kèm từng dòng hàng.
 */
@Data
@NoArgsConstructor
public class PurchaseOrderSummaryResponse {

    private UUID id;
    private UUID supplierId;
    private String supplierName;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private String paymentStatus;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** JPQL constructor expression — {@link com.tuplastic.erp.purchase.repository.PurchaseOrderRepository} */
    public PurchaseOrderSummaryResponse(
            UUID id,
            UUID supplierId,
            String supplierName,
            BigDecimal totalAmount,
            BigDecimal paidAmount,
            String paymentStatus,
            String status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        this.id = id;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.totalAmount = totalAmount;
        this.paidAmount = paidAmount;
        this.paymentStatus = paymentStatus;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
