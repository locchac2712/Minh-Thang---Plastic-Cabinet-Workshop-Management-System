package com.tuplastic.erp.production.service;

import com.tuplastic.erp.common.dto.chart.BucketPoint;
import com.tuplastic.erp.common.dto.chart.ChartGranularity;
import com.tuplastic.erp.common.dto.chart.ChartUtils;
import com.tuplastic.erp.common.dto.chart.NamedValuePoint;
import com.tuplastic.erp.production.dto.chart.MaterialConsumptionTrend;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductionChartService {

    private final EntityManager em;

    public List<BucketPoint> getTaskCompletionTrend(LocalDate fromDate, LocalDate toDate, ChartGranularity gran) {
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
                  SELECT date_trunc('%s', pt.completed_at) AS bucket,
                         COALESCE(SUM(pt.quantity), 0) AS value,
                         COUNT(*)::bigint AS cnt
                  FROM production_tasks pt
                  WHERE pt.status = 'Done'
                    AND pt.completed_at IS NOT NULL
                    AND pt.completed_at >= CAST(:fromDate AS timestamp)
                    AND pt.completed_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                  GROUP BY date_trunc('%s', pt.completed_at)
                )
                SELECT b.bucket::date, COALESCE(a.value, 0), COALESCE(a.cnt, 0)
                FROM buckets b LEFT JOIN agg a ON a.bucket = b.bucket
                ORDER BY b.bucket
                """.formatted(unit, unit, p.granularity.getInterval(), unit, unit);
        Query q = em.createNativeQuery(sql);
        q.setParameter("fromDate", p.from);
        q.setParameter("toDate", p.to);
        return mapBucket(q);
    }

    public List<NamedValuePoint> getTaskStatusBreakdown() {
        String sql = """
                SELECT pt.status,
                       COALESCE(SUM(pt.quantity), 0),
                       COUNT(*)::bigint
                FROM production_tasks pt
                GROUP BY pt.status
                ORDER BY 3 DESC
                """;
        Query q = em.createNativeQuery(sql);
        return mapNamed(q);
    }

    public List<NamedValuePoint> getTopWorkersThroughput(LocalDate fromDate, LocalDate toDate, int limit) {
        ChartUtils.Period p = ChartUtils.normalize(fromDate, toDate, ChartGranularity.DAY);
        int top = Math.max(1, Math.min(50, limit));
        String sql = """
                SELECT COALESCE(NULLIF(u.full_name, ''), u.username) AS name,
                       COALESCE(SUM(pt.quantity), 0) AS value,
                       COUNT(*)::bigint AS cnt
                FROM production_tasks pt
                JOIN users u ON u.id = pt.assigned_to
                WHERE pt.status = 'Done'
                  AND pt.completed_at IS NOT NULL
                  AND pt.completed_at >= CAST(:fromDate AS timestamp)
                  AND pt.completed_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                GROUP BY u.id, u.full_name, u.username
                ORDER BY value DESC
                LIMIT :top
                """;
        Query q = em.createNativeQuery(sql);
        q.setParameter("fromDate", p.from);
        q.setParameter("toDate", p.to);
        q.setParameter("top", top);
        return mapNamed(q);
    }

    /**
     * Stacked: trục Y là chi phí xuất kho (EXPORT + WASTE) theo bucket; tách top N material + others.
     */
    @SuppressWarnings("unchecked")
    public MaterialConsumptionTrend getMaterialConsumptionTrend(LocalDate fromDate, LocalDate toDate,
                                                                ChartGranularity gran, int topN) {
        ChartUtils.Period p = ChartUtils.normalize(fromDate, toDate, gran);
        int n = Math.max(1, Math.min(20, topN));
        String unit = p.granularity.getPgUnit();

        String topSql = """
                SELECT m.code, m.name,
                       SUM(ABS(il.quantity_change) * COALESCE(il.unit_price_at_time, 0)) AS damage
                FROM inventory_logs il
                JOIN materials m ON m.id = il.material_id
                WHERE il.transaction_type IN ('EXPORT', 'WASTE')
                  AND il.created_at >= CAST(:fromDate AS timestamp)
                  AND il.created_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                GROUP BY m.id, m.code, m.name
                ORDER BY damage DESC
                LIMIT :top
                """;
        Query topQ = em.createNativeQuery(topSql);
        topQ.setParameter("fromDate", p.from);
        topQ.setParameter("toDate", p.to);
        topQ.setParameter("top", n);
        List<Object[]> topRows = topQ.getResultList();
        List<MaterialConsumptionTrend.TopMaterial> tops = new ArrayList<>();
        Set<String> topCodes = new LinkedHashSet<>();
        for (Object[] r : topRows) {
            String code = r[0] != null ? r[0].toString() : null;
            String name = r[1] != null ? r[1].toString() : null;
            if (code == null) continue;
            tops.add(MaterialConsumptionTrend.TopMaterial.builder()
                    .materialCode(code).materialName(name).build());
            topCodes.add(code);
        }

        String trendSql = """
                WITH buckets AS (
                  SELECT generate_series(
                           date_trunc('%s', CAST(:fromDate AS timestamp)),
                           date_trunc('%s', CAST(:toDate AS timestamp)),
                           INTERVAL '%s'
                         ) AS bucket
                ),
                agg AS (
                  SELECT date_trunc('%s', il.created_at) AS bucket,
                         m.code AS code,
                         SUM(ABS(il.quantity_change) * COALESCE(il.unit_price_at_time, 0)) AS damage
                  FROM inventory_logs il
                  JOIN materials m ON m.id = il.material_id
                  WHERE il.transaction_type IN ('EXPORT', 'WASTE')
                    AND il.created_at >= CAST(:fromDate AS timestamp)
                    AND il.created_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                  GROUP BY date_trunc('%s', il.created_at), m.code
                )
                SELECT b.bucket::date, a.code, COALESCE(a.damage, 0)
                FROM buckets b LEFT JOIN agg a ON a.bucket = b.bucket
                ORDER BY b.bucket, a.code
                """.formatted(unit, unit, p.granularity.getInterval(), unit, unit);
        Query trendQ = em.createNativeQuery(trendSql);
        trendQ.setParameter("fromDate", p.from);
        trendQ.setParameter("toDate", p.to);
        List<Object[]> trendRows = trendQ.getResultList();

        Map<LocalDate, Map<String, BigDecimal>> byBucket = new LinkedHashMap<>();
        for (Object[] r : trendRows) {
            LocalDate bucket = ChartUtils.toLocalDate(r[0]);
            byBucket.computeIfAbsent(bucket, k -> {
                Map<String, BigDecimal> m = new LinkedHashMap<>();
                for (String code : topCodes) m.put(code, BigDecimal.ZERO);
                m.put("others", BigDecimal.ZERO);
                return m;
            });
            String code = r[1] != null ? r[1].toString() : null;
            BigDecimal val = ChartUtils.toBigDecimal(r[2]);
            if (code == null) continue;
            String key = topCodes.contains(code) ? code : "others";
            byBucket.get(bucket).merge(key, val, BigDecimal::add);
        }

        List<MaterialConsumptionTrend.MaterialConsumptionPoint> series = new ArrayList<>();
        for (Map.Entry<LocalDate, Map<String, BigDecimal>> e : byBucket.entrySet()) {
            series.add(MaterialConsumptionTrend.MaterialConsumptionPoint.builder()
                    .bucket(e.getKey())
                    .values(e.getValue())
                    .build());
        }
        return MaterialConsumptionTrend.builder()
                .topMaterials(tops)
                .series(series)
                .build();
    }

    /**
     * Late task snapshot: số task có {@code expected_end_date} thuộc bucket nhưng đến hôm nay vẫn chưa Done.
     */
    public List<BucketPoint> getLateTaskTrend(LocalDate fromDate, LocalDate toDate, ChartGranularity gran) {
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
                  SELECT date_trunc('%s', pt.expected_end_date::timestamp) AS bucket,
                         COALESCE(SUM(pt.quantity), 0) AS value,
                         COUNT(*)::bigint AS cnt
                  FROM production_tasks pt
                  WHERE pt.status <> 'Done'
                    AND pt.expected_end_date IS NOT NULL
                    AND pt.expected_end_date < CURRENT_DATE
                    AND pt.expected_end_date >= :fromDate
                    AND pt.expected_end_date <= :toDate
                  GROUP BY date_trunc('%s', pt.expected_end_date::timestamp)
                )
                SELECT b.bucket::date, COALESCE(a.value, 0), COALESCE(a.cnt, 0)
                FROM buckets b LEFT JOIN agg a ON a.bucket = b.bucket
                ORDER BY b.bucket
                """.formatted(unit, unit, p.granularity.getInterval(), unit, unit);
        Query q = em.createNativeQuery(sql);
        q.setParameter("fromDate", p.from);
        q.setParameter("toDate", p.to);
        return mapBucket(q);
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
