package com.tuplastic.erp.activitylog.repository;

import com.tuplastic.erp.activitylog.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {

    @Query("""
            SELECT a FROM ActivityLog a
            WHERE a.task.order.id = :orderId
            ORDER BY a.createdAt DESC
            """)
    List<ActivityLog> findByOrderId(@Param("orderId") UUID orderId);

    List<ActivityLog> findByTaskIdOrderByCreatedAtDesc(UUID taskId);

    List<ActivityLog> findByTaskIdOrderByCreatedAtAsc(UUID taskId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ActivityLog a WHERE a.task.id IN :taskIds")
    void deleteByTask_IdIn(@Param("taskIds") List<UUID> taskIds);
}
