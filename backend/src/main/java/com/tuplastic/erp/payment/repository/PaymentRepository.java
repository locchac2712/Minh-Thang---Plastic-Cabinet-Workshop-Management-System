package com.tuplastic.erp.payment.repository;

import com.tuplastic.erp.payment.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID>, JpaSpecificationExecutor<Payment> {

    long countByStatus(String status);

    List<Payment> findByOrderIdOrderByCreatedAtDesc(UUID orderId);

    Page<Payment> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    @Query("""
            SELECT p FROM Payment p
            WHERE p.agency.id = :agencyId
              AND (:status IS NULL OR p.status = :status)
            ORDER BY p.createdAt DESC
            """)
    Page<Payment> findByAgencyIdWithOptionalStatus(
            @Param("agencyId") UUID agencyId,
            @Param("status") String status,
            Pageable pageable);
}
