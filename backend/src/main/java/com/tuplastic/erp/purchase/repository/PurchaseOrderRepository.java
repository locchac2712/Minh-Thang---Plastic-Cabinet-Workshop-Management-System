package com.tuplastic.erp.purchase.repository;

import com.tuplastic.erp.purchase.dto.PurchaseOrderSummaryResponse;
import com.tuplastic.erp.purchase.entity.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {

    @Query("""
            SELECT new com.tuplastic.erp.purchase.dto.PurchaseOrderSummaryResponse(
                po.id, s.id, s.name, po.totalAmount, po.paidAmount, po.paymentStatus,
                po.status, po.createdAt, po.updatedAt)
            FROM PurchaseOrder po
            JOIN po.supplier s
            WHERE (:status IS NULL OR po.status = :status)
              AND (:paymentStatus IS NULL OR po.paymentStatus = :paymentStatus)
              AND (:supplierId IS NULL OR s.id = :supplierId)
            ORDER BY po.createdAt DESC
            """)
    Page<PurchaseOrderSummaryResponse> findSummariesForAccountant(
            @Param("status") String status,
            @Param("paymentStatus") String paymentStatus,
            @Param("supplierId") UUID supplierId,
            Pageable pageable);

    @Query("SELECT COUNT(po) FROM PurchaseOrder po WHERE po.status = :status")
    long countByStatus(@Param("status") String status);

    @Query("""
            SELECT COUNT(po) FROM PurchaseOrder po
            WHERE po.status <> 'Canceled'
              AND po.paymentStatus IN ('Unpaid', 'Partial')
            """)
    long countWithOpenPaymentObligation();
}
