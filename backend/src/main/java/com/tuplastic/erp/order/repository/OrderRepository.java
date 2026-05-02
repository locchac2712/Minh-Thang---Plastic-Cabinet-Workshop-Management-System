package com.tuplastic.erp.order.repository;

import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    @Query("""
            SELECT o FROM Order o
            WHERE o.createdBy.id = :sellerId
              AND (:statuses IS NULL OR o.status IN :statuses)
            ORDER BY o.createdAt DESC
            """)
    Page<Order> findBySellerWithFilters(@Param("sellerId") UUID sellerId,
                                        @Param("statuses") List<OrderStatus> statuses,
                                        Pageable pageable);

    Optional<Order> findByIdAndCreatedById(UUID id, UUID sellerId);

    @Query("""
            SELECT o FROM Order o
            WHERE o.agency.id = :agencyId
              AND o.createdBy.id = :sellerId
              AND (:statuses IS NULL OR o.status IN :statuses)
            ORDER BY o.createdAt DESC
            """)
    Page<Order> findByAgencyAndSeller(@Param("agencyId") UUID agencyId,
                                      @Param("sellerId") UUID sellerId,
                                      @Param("statuses") List<OrderStatus> statuses,
                                      Pageable pageable);

    Page<Order> findByStatusOrderByCreatedAtAsc(OrderStatus status, Pageable pageable);

    @Query("""
            SELECT o FROM Order o
            WHERE o.status = :orderStatus
              AND ((:invoiced = false AND NOT EXISTS (
                  SELECT 1 FROM Invoice i WHERE i.order.id = o.id AND i.status IN ('Draft', 'Issued')
              )) OR (:invoiced = true AND EXISTS (
                  SELECT 1 FROM Invoice i WHERE i.order.id = o.id AND i.status IN ('Draft', 'Issued')
              )))
            ORDER BY o.createdAt DESC
            """)
    Page<Order> findForInvoicing(@Param("orderStatus") OrderStatus orderStatus,
                                 @Param("invoiced") boolean invoiced,
                                 Pageable pageable);

    /**
     * Giám đốc: lọc đơn theo trạng thái (null = mọi trạng thái), đại lý, khoảng thời gian tạo đơn.
     */
    @Query("""
            SELECT o FROM Order o
            WHERE (:statuses IS NULL OR o.status IN :statuses)
              AND (:agencyId IS NULL OR o.agency.id = :agencyId)
              AND (:fromTs IS NULL OR o.createdAt >= :fromTs)
              AND (:toTs IS NULL OR o.createdAt < :toTs)
            ORDER BY o.createdAt DESC
            """)
    Page<Order> findForDirector(@Param("statuses") List<OrderStatus> statuses,
                                @Param("agencyId") UUID agencyId,
                                @Param("fromTs") LocalDateTime fromTs,
                                @Param("toTs") LocalDateTime toTs,
                                Pageable pageable);

    long countByStatus(OrderStatus status);

    @Query("""
            SELECT o.status, COUNT(o) FROM Order o
            WHERE o.createdBy.id = :sellerId
            GROUP BY o.status
            """)
    List<Object[]> countGroupByStatusForSeller(@Param("sellerId") UUID sellerId);

    @Query("""
            SELECT o.status, COUNT(o) FROM Order o
            WHERE o.createdBy.id = :sellerId
              AND (:fromTs IS NULL OR o.createdAt >= :fromTs)
              AND (:toTs IS NULL OR o.createdAt < :toTs)
            GROUP BY o.status
            """)
    List<Object[]> countGroupByStatusForSellerInPeriod(
            @Param("sellerId") UUID sellerId,
            @Param("fromTs") LocalDateTime fromTs,
            @Param("toTs") LocalDateTime toTs);
}
