package com.tuplastic.erp.notification.repository;

import com.tuplastic.erp.notification.entity.UserNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, UUID> {

    Page<UserNotification> findByUser_Id(UUID userId, Pageable pageable);

    Page<UserNotification> findByUser_IdAndIsRead(UUID userId, boolean isRead, Pageable pageable);

    long countByUser_IdAndIsRead(UUID userId, boolean isRead);

    Optional<UserNotification> findByNotification_IdAndUser_Id(UUID notificationId, UUID userId);

    boolean existsByNotification_IdAndUser_Id(UUID notificationId, UUID userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            UPDATE UserNotification un
            SET un.isRead = true,
                un.readAt = :readAt
            WHERE un.user.id = :userId
              AND un.isRead = false
            """)
    int markAllReadByUserId(@Param("userId") UUID userId, @Param("readAt") LocalDateTime readAt);
}
