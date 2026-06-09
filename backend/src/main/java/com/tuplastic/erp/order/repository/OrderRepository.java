package com.tuplastic.erp.order.repository;

import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.production.repository.ProductionOrderQueueRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {

    @Query("""
            SELECT o FROM Order o
            WHERE o.createdBy.id = :sellerId
              AND (:statuses IS NULL OR o.status IN :statuses)
            ORDER BY o.createdAt DESC
            """)
    Page<Order> findBySellerWithFilters(@Param("sellerId") UUID sellerId,
                                        @Param("statuses") List<OrderStatus> statuses,
                                        Pageable pageable);

    @Query("""
            SELECT o FROM Order o
            WHERE o.createdBy.id = :sellerId
              AND (:statuses IS NULL OR o.status IN :statuses)
              AND o.sourceOrder IS NULL
            ORDER BY o.createdAt DESC
            """)
    Page<Order> findQuotationsBySellerWithFilters(@Param("sellerId") UUID sellerId,
                                                  @Param("statuses") List<OrderStatus> statuses,
                                                  Pageable pageable);

    @Query("""
            SELECT o FROM Order o
            WHERE o.createdBy.id = :sellerId
              AND (:statuses IS NULL OR o.status IN :statuses)
              AND o.sourceOrder IS NOT NULL
            ORDER BY o.createdAt DESC
            """)
    Page<Order> findFulfillmentOrdersBySellerWithFilters(@Param("sellerId") UUID sellerId,
                                                         @Param("statuses") List<OrderStatus> statuses,
                                                         Pageable pageable);

    Optional<Order> findByDisplayCode(String displayCode);

    Optional<Order> findByDisplayCodeAndCreatedById(String displayCode, UUID sellerId);

    @Query(value = "SELECT nextval('quotation_number_seq')", nativeQuery = true)
    long nextQuotationNumberSeq();

    @Query(value = "SELECT nextval('order_number_seq')", nativeQuery = true)
    long nextOrderNumberSeq();

    Page<Order> findByStatusAndSourceOrderIsNullOrderByCreatedAtAsc(OrderStatus status, Pageable pageable);

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
    List<Order> findByStatus(OrderStatus status);

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

    @Query("""
            SELECT o.status, COUNT(o) FROM Order o
            WHERE o.createdBy.id = :sellerId
              AND o.sourceOrder IS NOT NULL
              AND o.status IN :statuses
            GROUP BY o.status
            """)
    List<Object[]> countFulfillmentOrdersBySellerAndStatuses(
            @Param("sellerId") UUID sellerId,
            @Param("statuses") List<OrderStatus> statuses);

    /**
     * Danh sách đơn cho xưởng (queue lập lô) — aggregate taskCount + remainingBatchable trong một query.
     */
    @Query(value = """
            SELECT o.id AS orderId,
                   o.display_code AS orderDisplayCode,
                   a.name AS agencyName,
                   o.expected_delivery_date AS expectedDeliveryDate,
                   o.created_at AS createdAt,
                   (SELECT COUNT(*) FROM production_tasks pt WHERE pt.order_id = o.id) AS taskCount,
                   COALESCE((
                     SELECT SUM(GREATEST(0, oi.quantity - COALESCE((
                       SELECT SUM(pt2.quantity) FROM production_tasks pt2 WHERE pt2.order_item_id = oi.id
                     ), 0)))
                     FROM order_items oi WHERE oi.order_id = o.id
                   ), 0) AS remainingBatchableTotal
            FROM orders o
            INNER JOIN agencies a ON a.id = o.agency_id
            WHERE o.status IN (:statuses)
              AND o.source_order_id IS NOT NULL
              AND (
                :awaitingBatch IS NULL
                OR :awaitingBatch = false
                OR (SELECT COUNT(*) FROM production_tasks pt WHERE pt.order_id = o.id) = 0
                OR COALESCE((
                     SELECT SUM(GREATEST(0, oi.quantity - COALESCE((
                       SELECT SUM(pt2.quantity) FROM production_tasks pt2 WHERE pt2.order_item_id = oi.id
                     ), 0)))
                     FROM order_items oi WHERE oi.order_id = o.id
                   ), 0) > 0
              )
              AND (
                :search IS NULL
                OR TRIM(CAST(:search AS text)) = ''
                OR LOWER(COALESCE(o.display_code, '')) LIKE LOWER(CONCAT('%', TRIM(CAST(:search AS text)), '%'))
                OR LOWER(a.name) LIKE LOWER(CONCAT('%', TRIM(CAST(:search AS text)), '%'))
                OR CAST(o.id AS text) LIKE CONCAT('%', TRIM(CAST(:search AS text)), '%')
              )
            ORDER BY o.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM orders o
            INNER JOIN agencies a ON a.id = o.agency_id
            WHERE o.status IN (:statuses)
              AND o.source_order_id IS NOT NULL
              AND (
                :awaitingBatch IS NULL
                OR :awaitingBatch = false
                OR (SELECT COUNT(*) FROM production_tasks pt WHERE pt.order_id = o.id) = 0
                OR COALESCE((
                     SELECT SUM(GREATEST(0, oi.quantity - COALESCE((
                       SELECT SUM(pt2.quantity) FROM production_tasks pt2 WHERE pt2.order_item_id = oi.id
                     ), 0)))
                     FROM order_items oi WHERE oi.order_id = o.id
                   ), 0) > 0
              )
              AND (
                :search IS NULL
                OR TRIM(CAST(:search AS text)) = ''
                OR LOWER(COALESCE(o.display_code, '')) LIKE LOWER(CONCAT('%', TRIM(CAST(:search AS text)), '%'))
                OR LOWER(a.name) LIKE LOWER(CONCAT('%', TRIM(CAST(:search AS text)), '%'))
                OR CAST(o.id AS text) LIKE CONCAT('%', TRIM(CAST(:search AS text)), '%')
              )
            """,
            nativeQuery = true)
    Page<ProductionOrderQueueRow> findProductionOrderQueue(@Param("statuses") List<String> statuses,
                                                           @Param("awaitingBatch") Boolean awaitingBatch,
                                                           @Param("search") String search,
                                                           Pageable pageable);

    @Query(value = """
            SELECT o.id AS orderId,
                   o.display_code AS orderDisplayCode,
                   a.name AS agencyName,
                   o.expected_delivery_date AS expectedDeliveryDate,
                   o.created_at AS createdAt,
                   (SELECT COUNT(*) FROM production_tasks pt WHERE pt.order_id = o.id) AS taskCount,
                   COALESCE((
                     SELECT SUM(GREATEST(0, oi.quantity - COALESCE((
                       SELECT SUM(pt2.quantity) FROM production_tasks pt2 WHERE pt2.order_item_id = oi.id
                     ), 0)))
                     FROM order_items oi WHERE oi.order_id = o.id
                   ), 0) AS remainingBatchableTotal
            FROM orders o
            INNER JOIN agencies a ON a.id = o.agency_id
            WHERE o.id = :orderId
            """,
            nativeQuery = true)
    Optional<ProductionOrderQueueRow> findProductionOrderQueueStats(@Param("orderId") UUID orderId);

    @Query(value = """
            SELECT COALESCE(SUM(GREATEST(o.total_payable - o.paid_amount, 0)), 0)
            FROM orders o
            WHERE o.source_order_id IS NOT NULL
              AND o.status IN ('Approved', 'Producing', 'Done')
              AND o.agency_id = :agencyId
            """, nativeQuery = true)
    BigDecimal sumRemainingDebtForAgency(@Param("agencyId") UUID agencyId);

    @Query(value = """
            SELECT o.agency_id,
                   COALESCE(SUM(GREATEST(o.total_payable - o.paid_amount, 0)), 0)
            FROM orders o
            WHERE o.source_order_id IS NOT NULL
              AND o.status IN ('Approved', 'Producing', 'Done')
              AND o.agency_id IN (:agencyIds)
            GROUP BY o.agency_id
            """, nativeQuery = true)
    List<Object[]> sumRemainingDebtByAgencyIds(@Param("agencyIds") Collection<UUID> agencyIds);

    @Query(value = """
            SELECT o.agency_id,
                   COALESCE(SUM(GREATEST(o.total_payable - o.paid_amount, 0)), 0)
            FROM orders o
            WHERE o.source_order_id IS NOT NULL
              AND o.status IN ('Approved', 'Producing', 'Done')
            GROUP BY o.agency_id
            """, nativeQuery = true)
    List<Object[]> sumRemainingDebtAllAgencies();
}
