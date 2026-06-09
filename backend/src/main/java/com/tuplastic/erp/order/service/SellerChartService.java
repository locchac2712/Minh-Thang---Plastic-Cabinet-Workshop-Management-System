package com.tuplastic.erp.order.service;

import com.tuplastic.erp.common.dto.chart.BucketPoint;
import com.tuplastic.erp.common.dto.chart.ChartGranularity;
import com.tuplastic.erp.common.dto.chart.ChartUtils;
import com.tuplastic.erp.common.dto.chart.NamedValuePoint;
import com.tuplastic.erp.order.dto.chart.AgencyDebtRiskPoint;
import com.tuplastic.erp.order.dto.chart.SellerOpenOrdersCountResponse;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.reconcile.AgencyDebtComputationService;
import com.tuplastic.erp.user.entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

/**
 * Mọi chart đều filter theo {@code orders.created_by = currentUser} hoặc {@code agencies.assigned_seller_id} tương ứng.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SellerChartService {

    private static final List<OrderStatus> OPEN_FULFILLMENT_STATUSES =
            List.copyOf(EnumSet.of(OrderStatus.Approved, OrderStatus.Producing));

    private final EntityManager em;
    private final OrderRepository orderRepository;
    private final AgencyDebtComputationService agencyDebtComputationService;

    public List<BucketPoint> getMyRevenueTrend(User seller, LocalDate fromDate, LocalDate toDate, ChartGranularity gran) {
        ChartUtils.Period p = ChartUtils.normalize(fromDate, toDate, gran);
        String unit = p.granularity.getPgUnit();
        String sql = """
                WITH buckets AS (
                  SELECT generate_series(
                           date_trunc('%s', CAST(:fromDate AS timestamp)),
                           date_trunc('%s', CAST(:toDate AS timestamp)),
                           INTERVAL '%s'
                         ) AS bucket
                ),
                agg AS (
                  SELECT date_trunc('%s', o.created_at) AS bucket,
                         COALESCE(SUM(o.total_payable), 0) AS value,
                         COUNT(*)::bigint AS cnt
                  FROM orders o
                  WHERE o.status = 'Done'
                    AND o.created_by = :sellerId
                    AND o.created_at >= CAST(:fromDate AS timestamp)
                    AND o.created_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                  GROUP BY date_trunc('%s', o.created_at)
                )
                SELECT b.bucket::date, COALESCE(a.value, 0), COALESCE(a.cnt, 0)
                FROM buckets b LEFT JOIN agg a ON a.bucket = b.bucket
                ORDER BY b.bucket
                """.formatted(unit, unit, p.granularity.getInterval(), unit, unit);
        Query q = em.createNativeQuery(sql);
        q.setParameter("fromDate", p.from);
        q.setParameter("toDate", p.to);
        q.setParameter("sellerId", seller.getId());
        return mapBucket(q);
    }

    public List<NamedValuePoint> getMyOrderStatusBreakdown(User seller, LocalDate fromDate, LocalDate toDate) {
        ChartUtils.Period p = ChartUtils.normalize(fromDate, toDate, ChartGranularity.DAY);
        String sql = """
                SELECT o.status,
                       COALESCE(SUM(o.total_payable), 0),
                       COUNT(*)::bigint
                FROM orders o
                WHERE o.created_by = :sellerId
                  AND o.created_at >= CAST(:fromDate AS timestamp)
                  AND o.created_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                GROUP BY o.status
                ORDER BY 3 DESC
                """;
        Query q = em.createNativeQuery(sql);
        q.setParameter("fromDate", p.from);
        q.setParameter("toDate", p.to);
        q.setParameter("sellerId", seller.getId());
        return mapNamed(q);
    }

    /**
     * Đơn fulfillment đang mở: {@code Approved} + {@code Producing} (lens {@code /api/seller/orders}).
     * Không gộp báo giá ({@code sourceOrder IS NULL}) và không tính {@code Done}/{@code Canceled}.
     */
    public SellerOpenOrdersCountResponse getMyOpenOrdersCount(User seller) {
        long approved = 0;
        long producing = 0;
        for (Object[] row : orderRepository.countFulfillmentOrdersBySellerAndStatuses(
                seller.getId(), OPEN_FULFILLMENT_STATUSES)) {
            OrderStatus status = (OrderStatus) row[0];
            long cnt = ((Number) row[1]).longValue();
            if (status == OrderStatus.Approved) {
                approved = cnt;
            } else if (status == OrderStatus.Producing) {
                producing = cnt;
            }
        }
        return SellerOpenOrdersCountResponse.builder()
                .approvedCount(approved)
                .producingCount(producing)
                .count(approved + producing)
                .build();
    }

    /**
     * Pipeline funnel theo lifetime của seller (không lọc kỳ); status xuất hiện cố định để FE vẽ funnel.
     * Chỉ đếm đơn fulfillment ({@code source_order_id IS NOT NULL}).
     */
    public List<NamedValuePoint> getMyPipelineFunnel(User seller) {
        String sql = """
                WITH s(name, ord) AS (
                  VALUES ('Draft',1),('Pending',2),('Approved',3),('Producing',4),('Done',5)
                ),
                c AS (
                  SELECT o.status AS name,
                         COALESCE(SUM(o.total_payable), 0) AS value,
                         COUNT(*)::bigint AS cnt
                  FROM orders o
                  WHERE o.created_by = :sellerId
                    AND o.source_order_id IS NOT NULL
                  GROUP BY o.status
                )
                SELECT s.name,
                       COALESCE(c.value, 0),
                       COALESCE(c.cnt, 0)
                FROM s LEFT JOIN c ON c.name = s.name
                ORDER BY s.ord
                """;
        Query q = em.createNativeQuery(sql);
        q.setParameter("sellerId", seller.getId());
        return mapNamed(q);
    }

    public List<NamedValuePoint> getMyTopAgencies(User seller, LocalDate fromDate, LocalDate toDate, int limit) {
        ChartUtils.Period p = ChartUtils.normalize(fromDate, toDate, ChartGranularity.DAY);
        int top = Math.max(1, Math.min(50, limit));
        String sql = """
                SELECT a.name,
                       COALESCE(SUM(o.total_payable), 0),
                       COUNT(o.id)::bigint
                FROM orders o
                JOIN agencies a ON a.id = o.agency_id
                WHERE o.status = 'Done'
                  AND o.created_by = :sellerId
                  AND o.created_at >= CAST(:fromDate AS timestamp)
                  AND o.created_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                GROUP BY a.id, a.name
                ORDER BY 2 DESC
                LIMIT :top
                """;
        Query q = em.createNativeQuery(sql);
        q.setParameter("fromDate", p.from);
        q.setParameter("toDate", p.to);
        q.setParameter("sellerId", seller.getId());
        q.setParameter("top", top);
        return mapNamed(q);
    }

    /**
     * Snapshot hiện tại: agency mà seller được assign + tỉ lệ debt / max_debt_limit.
     */
    public List<AgencyDebtRiskPoint> getMyAgencyDebtRisk(User seller) {
        String sql = """
                SELECT a.id, a.name, a.total_debt, a.max_debt_limit
                FROM agencies a
                WHERE a.assigned_seller_id = :sellerId
                  AND a.is_active = TRUE
                ORDER BY a.total_debt DESC
                """;
        Query q = em.createNativeQuery(sql);
        q.setParameter("sellerId", seller.getId());
        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        List<AgencyDebtRiskPoint> out = new ArrayList<>();
        for (Object[] r : rows) {
            UUID agencyId = ChartUtils.toUuid(r[0]);
            BigDecimal recorded = ChartUtils.toBigDecimal(r[2]);
            BigDecimal limit = ChartUtils.toBigDecimal(r[3]);
            BigDecimal computed = agencyDebtComputationService.computeForAgency(agencyId);
            BigDecimal ratio = limit.compareTo(BigDecimal.ZERO) == 0
                    ? null
                    : computed.multiply(BigDecimal.valueOf(100)).divide(limit, 1, RoundingMode.HALF_UP);
            out.add(AgencyDebtRiskPoint.builder()
                    .agencyId(agencyId)
                    .agencyName(r[1] != null ? r[1].toString() : null)
                    .totalDebt(recorded)
                    .computedDebtFromOrders(computed)
                    .debtReconciliationDelta(
                            agencyDebtComputationService.reconciliationDelta(recorded, computed))
                    .maxDebtLimit(limit)
                    .debtRatioPercent(ratio)
                    .build());
        }
        return out;
    }

    private List<BucketPoint> mapBucket(Query q) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        List<BucketPoint> out = new ArrayList<>();
        for (Object[] r : rows) {
            out.add(BucketPoint.builder()
                    .bucket(ChartUtils.toLocalDate(r[0]))
                    .value(ChartUtils.toBigDecimal(r[1]))
                    .count(ChartUtils.toLong(r[2]))
                    .build());
        }
        return out;
    }

    private List<NamedValuePoint> mapNamed(Query q) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        List<NamedValuePoint> out = new ArrayList<>();
        for (Object[] r : rows) {
            out.add(NamedValuePoint.builder()
                    .name(r[0] != null ? r[0].toString() : null)
                    .value(ChartUtils.toBigDecimal(r[1]))
                    .count(ChartUtils.toLong(r[2]))
                    .build());
        }
        return out;
    }
}
