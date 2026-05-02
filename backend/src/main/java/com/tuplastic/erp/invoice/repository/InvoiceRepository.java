package com.tuplastic.erp.invoice.repository;

import com.tuplastic.erp.invoice.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    boolean existsByOrder_IdAndStatusIn(UUID orderId, Iterable<String> statuses);

    List<Invoice> findByOrder_IdOrderByCreatedAtDesc(UUID orderId);

    @Query("""
            SELECT i FROM Invoice i
            WHERE (:status IS NULL OR i.status = :status)
              AND (:orderId IS NULL OR i.order.id = :orderId)
            ORDER BY i.createdAt DESC
            """)
    Page<Invoice> findForAccountant(
            @Param("status") String status,
            @Param("orderId") UUID orderId,
            Pageable pageable);

    @Query(value = "SELECT nextval('invoice_number_seq')", nativeQuery = true)
    long nextInvoiceNumberSequenceValue();

    long countByStatus(String status);
}
