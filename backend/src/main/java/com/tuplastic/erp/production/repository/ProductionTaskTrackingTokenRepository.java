package com.tuplastic.erp.production.repository;

import com.tuplastic.erp.production.entity.ProductionTaskTrackingToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface ProductionTaskTrackingTokenRepository extends JpaRepository<ProductionTaskTrackingToken, UUID> {

    Optional<ProductionTaskTrackingToken> findByTokenHash(String tokenHash);

    Optional<ProductionTaskTrackingToken> findFirstByTask_IdAndRevokedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
            UUID taskId,
            LocalDateTime now);

    @Modifying
    @Query("""
            UPDATE ProductionTaskTrackingToken t
            SET t.revokedAt = :revokedAt
            WHERE t.task.id = :taskId AND t.revokedAt IS NULL
            """)
    int revokeActiveByTaskId(@Param("taskId") UUID taskId, @Param("revokedAt") LocalDateTime revokedAt);
}
