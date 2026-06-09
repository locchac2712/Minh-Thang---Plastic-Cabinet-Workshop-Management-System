package com.tuplastic.erp.production.repository;

import com.tuplastic.erp.production.entity.ProductionTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductionTaskRepository extends JpaRepository<ProductionTask, UUID> {

    Optional<ProductionTask> findByDisplayCode(String displayCode);

    @Query(value = "SELECT nextval('production_task_number_seq')", nativeQuery = true)
    long nextProductionTaskNumberSeq();

    List<ProductionTask> findByOrder_IdOrderByCreatedAtAsc(UUID orderId);
    List<ProductionTask> findByStatus(String status);

    @Query("""
            SELECT t FROM ProductionTask t
            LEFT JOIN t.order o
            WHERE (:statuses IS NULL OR t.status IN :statuses)
              AND (t.order IS NULL OR o.sourceOrder IS NOT NULL)
            ORDER BY t.expectedEndDate ASC NULLS LAST, t.createdAt ASC
            """)
    Page<ProductionTask> findWithFilters(@Param("statuses") List<String> statuses,
                                         Pageable pageable);

    @Query("SELECT t.status, COUNT(t) FROM ProductionTask t GROUP BY t.status")
    List<Object[]> countGroupByStatus();

    @Query("""
            SELECT t FROM ProductionTask t
            LEFT JOIN t.order o
            WHERE t.assignedTo.id = :userId
              AND t.status IN ('Waiting', 'Doing')
              AND (t.order IS NULL OR o.sourceOrder IS NOT NULL)
            ORDER BY t.expectedEndDate ASC NULLS LAST, t.createdAt ASC
            """)
    List<ProductionTask> findOpenTasksForAssignee(@Param("userId") UUID userId, Pageable pageable);

    List<ProductionTask> findByOrderItem_IdOrderByCreatedAtAsc(UUID orderItemId);

    @Query("""
            SELECT COALESCE(SUM(t.quantity), 0) FROM ProductionTask t
            WHERE t.orderItem.id = :orderItemId
            """)
    int sumQuantityByOrderItemId(@Param("orderItemId") UUID orderItemId);

    boolean existsByOrderItem_IdAndStatusIn(UUID orderItemId, List<String> statuses);

    @Query("""
            SELECT COALESCE(SUM(t.quantity), 0) FROM ProductionTask t
            WHERE t.order.id = :orderId AND t.orderItem.id = :orderItemId
            """)
    int sumQuantityByOrderIdAndOrderItemId(@Param("orderId") UUID orderId,
                                           @Param("orderItemId") UUID orderItemId);

    @Query("""
            SELECT COUNT(t) FROM ProductionTask t
            WHERE t.order.id = :orderId
              AND t.status IN ('Waiting', 'Doing')
            """)
    long countOpenTasksByOrderId(@Param("orderId") UUID orderId);
}
