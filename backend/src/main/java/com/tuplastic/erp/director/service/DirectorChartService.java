package com.tuplastic.erp.director.service;

import com.tuplastic.erp.common.dto.chart.BucketPoint;
import com.tuplastic.erp.common.dto.chart.ChartGranularity;
import com.tuplastic.erp.common.dto.chart.ChartUtils;
import com.tuplastic.erp.common.dto.chart.NamedValuePoint;
import com.tuplastic.erp.director.dto.chart.GrossMarginTrendPoint;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DirectorChartService {

    private final EntityManager em;

    /**
     * Doanh thu các đơn {@code Done} theo bucket; bucket trống = 0 (dùng generate_series).
     */
    public List<BucketPoint> getRevenueTrend(LocalDate fromDate, LocalDate toDate, ChartGranularity gran) {
        ChartUtils.Period p = ChartUtils.normalize(fromDate, toDate, gran);
        String sql = bucketSql(p, """
                SELECT date_trunc('%s', o.created_at) AS bucket,
                       COALESCE(SUM(o.total_payable), 0) AS value,
                       COUNT(*)::bigint AS cnt
                FROM orders o
                WHERE o.status = 'Done'
                  AND o.created_at >= CAST(:fromDate AS timestamp)
                  AND o.created_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                GROUP BY date_trunc('%s', o.created_at)
                """);
        Query q = buildBucketQuery(sql, p);
        return mapBucketPoints(q);
    }

    public List<NamedValuePoint> getOrderStatusBreakdown(LocalDate fromDate, LocalDate toDate) {
        ChartUtils.Period p = ChartUtils.normalize(fromDate, toDate, ChartGranularity.DAY);
        String sql = """
                SELECT o.status AS name,
                       COALESCE(SUM(o.total_payable), 0) AS value,
                       COUNT(*)::bigint AS cnt
                FROM orders o
                WHERE o.created_at >= CAST(:fromDate AS timestamp)
                  AND o.created_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                GROUP BY o.status
                ORDER BY cnt DESC
                """;
        Query q = em.createNativeQuery(sql);
        q.setParameter("fromDate", p.from);
        q.setParameter("toDate", p.to);
        return mapNamedValuePoints(q);
    }

    /**
     * Combo chart: revenue (line/bar) + cost (line/bar) + margin% (line phụ). Gộp `order_items` để có cost chính xác.
     */
    public List<GrossMarginTrendPoint> getGrossMarginTrend(LocalDate fromDate, LocalDate toDate, ChartGranularity gran) {
        ChartUtils.Period p = ChartUtils.normalize(fromDate, toDate, gran);
        String sql = bucketSqlMulti(p, """
                SELECT date_trunc('%s', o.created_at) AS bucket,
                       COALESCE(SUM(oi.unit_price * oi.quantity), 0) AS revenue,
                       COALESCE(SUM(oi.unit_cost_at_time * oi.quantity), 0) AS cost
                FROM orders o
                JOIN order_items oi ON oi.order_id = o.id
                WHERE o.status = 'Done'
                  AND o.created_at >= CAST(:fromDate AS timestamp)
                  AND o.created_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                GROUP BY date_trunc('%s', o.created_at)
                """, "revenue", "cost");
        Query q = buildBucketQuery(sql, p);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        List<GrossMarginTrendPoint> out = new ArrayList<>();
        for (Object[] r : rows) {
            BigDecimal revenue = ChartUtils.toBigDecimal(r[1]);
            BigDecimal cost = ChartUtils.toBigDecimal(r[2]);
            BigDecimal margin = revenue.subtract(cost);
            BigDecimal marginPercent = revenue.compareTo(BigDecimal.ZERO) == 0
                    ? null
                    : margin.multiply(BigDecimal.valueOf(100)).divide(revenue, 1, RoundingMode.HALF_UP);
            out.add(GrossMarginTrendPoint.builder()
                    .bucket(ChartUtils.toLocalDate(r[0]))
                    .revenue(revenue)
                    .cost(cost)
                    .grossMargin(margin)
                    .marginPercent(marginPercent)
                    .build());
        }
        return out;
    }

    public List<NamedValuePoint> getTopAgenciesRevenue(LocalDate fromDate, LocalDate toDate, int limit) {
        ChartUtils.Period p = ChartUtils.normalize(fromDate, toDate, ChartGranularity.DAY);
        int top = Math.max(1, Math.min(50, limit));
        String sql = """
                SELECT a.name AS name,
                       COALESCE(SUM(o.total_payable), 0) AS value,
                       COUNT(o.id)::bigint AS cnt
                FROM orders o
                JOIN agencies a ON a.id = o.agency_id
                WHERE o.status = 'Done'
                  AND o.created_at >= CAST(:fromDate AS timestamp)
                  AND o.created_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                GROUP BY a.id, a.name
                ORDER BY value DESC
                LIMIT :top
                """;
        Query q = em.createNativeQuery(sql);
        q.setParameter("fromDate", p.from);
        q.setParameter("toDate", p.to);
        q.setParameter("top", top);
        return mapNamedValuePoints(q);
    }

    public List<BucketPoint> getCashCollectionTrend(LocalDate fromDate, LocalDate toDate, ChartGranularity gran) {
        ChartUtils.Period p = ChartUtils.normalize(fromDate, toDate, gran);
        String sql = bucketSql(p, """
                SELECT date_trunc('%s', pm.created_at) AS bucket,
                       COALESCE(SUM(pm.amount), 0) AS value,
                       COUNT(*)::bigint AS cnt
                FROM payments pm
                WHERE pm.status = 'Completed'
                  AND pm.created_at >= CAST(:fromDate AS timestamp)
                  AND pm.created_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                GROUP BY date_trunc('%s', pm.created_at)
                """);
        Query q = buildBucketQuery(sql, p);
        return mapBucketPoints(q);
    }

    /**
     * Wrap inner SELECT (yields bucket/value/cnt) bằng generate_series để bucket trống = 0.
     * @param innerWithFormat inner SELECT có 2 chỗ {@code %s} cho granularity unit (date_trunc).
     */
    private String bucketSql(ChartUtils.Period p, String innerWithFormat) {
        String unit = p.granularity.getPgUnit();
        String inner = String.format(innerWithFormat, unit, unit);
        return """
                WITH buckets AS (
                  SELECT generate_series(
                           date_trunc('%s', CAST(:fromDate AS timestamp)),
                           date_trunc('%s', CAST(:toDate AS timestamp)),
                           INTERVAL '%s'
                         ) AS bucket
                ),
                agg AS (
                  %s
                )
                SELECT b.bucket::date AS bucket,
                       COALESCE(a.value, 0) AS value,
                       COALESCE(a.cnt, 0) AS cnt
                FROM buckets b
                LEFT JOIN agg a ON a.bucket = b.bucket
                ORDER BY b.bucket
                """.formatted(unit, unit, p.granularity.getInterval(), inner);
    }

    /**
     * Wrap inner SELECT (yields bucket + N cột số) bằng generate_series; cột tên cố định trong SELECT cuối.
     */
    private String bucketSqlMulti(ChartUtils.Period p, String innerWithFormat, String... cols) {
        String unit = p.granularity.getPgUnit();
        String inner = String.format(innerWithFormat, unit, unit);
        StringBuilder colSelect = new StringBuilder();
        for (String c : cols) {
            colSelect.append(", COALESCE(a.").append(c).append(", 0) AS ").append(c);
        }
        return """
                WITH buckets AS (
                  SELECT generate_series(
                           date_trunc('%s', CAST(:fromDate AS timestamp)),
                           date_trunc('%s', CAST(:toDate AS timestamp)),
                           INTERVAL '%s'
                         ) AS bucket
                ),
                agg AS (
                  %s
                )
                SELECT b.bucket::date AS bucket %s
                FROM buckets b
                LEFT JOIN agg a ON a.bucket = b.bucket
                ORDER BY b.bucket
                """.formatted(unit, unit, p.granularity.getInterval(), inner, colSelect.toString());
    }

    private Query buildBucketQuery(String sql, ChartUtils.Period p) {
        Query q = em.createNativeQuery(sql);
        q.setParameter("fromDate", p.from);
        q.setParameter("toDate", p.to);
        return q;
    }

    private List<BucketPoint> mapBucketPoints(Query q) {
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

    private List<NamedValuePoint> mapNamedValuePoints(Query q) {
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
