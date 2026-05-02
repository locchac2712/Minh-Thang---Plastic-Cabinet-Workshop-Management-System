package com.tuplastic.erp.production.repository;

import com.tuplastic.erp.production.entity.ProductionTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductionTaskRepository extends JpaRepository<ProductionTask, UUID> {

    List<ProductionTask> findByOrder_IdOrderByCreatedAtAsc(UUID orderId);

    @Query("""
            SELECT t FROM ProductionTask t
            WHERE (:statuses IS NULL OR t.status IN :statuses)
            ORDER BY t.expectedEndDate ASC NULLS LAST, t.createdAt ASC
            """)
    Page<ProductionTask> findWithFilters(@Param("statuses") List<String> statuses,
                                         Pageable pageable);

    @Query("SELECT t.status, COUNT(t) FROM ProductionTask t GROUP BY t.status")
    List<Object[]> countGroupByStatus();

    @Query("""
            SELECT t FROM ProductionTask t
            WHERE t.assignedTo.id = :userId
              AND t.status IN ('Waiting', 'Doing')
            ORDER BY t.expectedEndDate ASC NULLS LAST, t.createdAt ASC
            """)
    List<ProductionTask> findOpenTasksForAssignee(@Param("userId") UUID userId, Pageable pageable);
}
