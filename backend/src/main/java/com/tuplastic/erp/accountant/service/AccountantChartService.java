package com.tuplastic.erp.accountant.service;

import com.tuplastic.erp.accountant.dto.chart.CashFlowTrendPoint;
import com.tuplastic.erp.accountant.dto.chart.InvoiceStatusTrendPoint;
import com.tuplastic.erp.common.dto.chart.AgingBucket;
import com.tuplastic.erp.common.dto.chart.AgingBucketLabels;
import com.tuplastic.erp.common.dto.chart.ChartGranularity;
import com.tuplastic.erp.common.dto.chart.ChartUtils;
import com.tuplastic.erp.common.dto.chart.NamedValuePoint;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccountantChartService {

    private final EntityManager em;

    public List<CashFlowTrendPoint> getCashFlowTrend(LocalDate fromDate, LocalDate toDate, ChartGranularity gran) {
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
                inflow AS (
                  SELECT date_trunc('%s', pm.created_at) AS bucket,
                         COALESCE(SUM(pm.amount), 0) AS amt
                  FROM payments pm
                  WHERE pm.status = 'Completed'
                    AND pm.created_at >= CAST(:fromDate AS timestamp)
                    AND pm.created_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                  GROUP BY date_trunc('%s', pm.created_at)
                ),
                outflow AS (
                  SELECT date_trunc('%s', po.updated_at) AS bucket,
                         COALESCE(SUM(po.paid_amount), 0) AS amt
                  FROM purchase_orders po
                  WHERE po.paid_amount > 0
                    AND po.updated_at >= CAST(:fromDate AS timestamp)
                    AND po.updated_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                  GROUP BY date_trunc('%s', po.updated_at)
                )
                SELECT b.bucket::date,
                       COALESCE(i.amt, 0) AS inflow,
                       COALESCE(o.amt, 0) AS outflow
                FROM buckets b
                LEFT JOIN inflow i ON i.bucket = b.bucket
                LEFT JOIN outflow o ON o.bucket = b.bucket
                ORDER BY b.bucket
                """.formatted(unit, unit, p.granularity.getInterval(), unit, unit, unit, unit);
        Query q = em.createNativeQuery(sql);
        q.setParameter("fromDate", p.from);
        q.setParameter("toDate", p.to);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        List<CashFlowTrendPoint> out = new ArrayList<>();
        for (Object[] r : rows) {
            BigDecimal in = ChartUtils.toBigDecimal(r[1]);
            BigDecimal outV = ChartUtils.toBigDecimal(r[2]);
            out.add(CashFlowTrendPoint.builder()
                    .bucket(ChartUtils.toLocalDate(r[0]))
                    .inflow(in)
                    .outflow(outV)
                    .net(in.subtract(outV))
                    .build());
        }
        return out;
    }

    /**
     * Aging dựa trên {@code orders.updated_at} (giả định ngày cuối cập nhật trạng thái Done) — tài liệu FE ghi rõ.
     */
    public List<AgingBucket> getReceivablesAging() {
        String sql = """
                WITH overdue AS (
                  SELECT (CURRENT_DATE - o.updated_at::date) AS days,
                         (o.total_payable - o.paid_amount) AS remain
                  FROM orders o
                  WHERE o.status = 'Done'
                    AND o.paid_amount < o.total_payable
                ),
                cls AS (
                  SELECT CASE
                            WHEN days <= 30 THEN '0-30'
                            WHEN days <= 60 THEN '31-60'
                            WHEN days <= 90 THEN '61-90'
                            ELSE '>90'
                         END AS range,
                         remain
                  FROM overdue
                )
                SELECT range, COALESCE(SUM(remain), 0) AS amount, COUNT(*)::bigint AS cnt
                FROM cls
                GROUP BY range
                ORDER BY CASE range
                            WHEN '0-30' THEN 1
                            WHEN '31-60' THEN 2
                            WHEN '61-90' THEN 3
                            ELSE 4
                         END
                """;
        Query q = em.createNativeQuery(sql);
        return mapAging(q);
    }

    public List<AgingBucket> getPayablesAging() {
        String sql = """
                WITH overdue AS (
                  SELECT (CURRENT_DATE - po.updated_at::date) AS days,
                         (po.total_amount - po.paid_amount) AS remain
                  FROM purchase_orders po
                  WHERE po.status = 'Received'
                    AND po.paid_amount < po.total_amount
                ),
                cls AS (
                  SELECT CASE
                            WHEN days <= 30 THEN '0-30'
                            WHEN days <= 60 THEN '31-60'
                            WHEN days <= 90 THEN '61-90'
                            ELSE '>90'
                         END AS range,
                         remain
                  FROM overdue
                )
                SELECT range, COALESCE(SUM(remain), 0), COUNT(*)::bigint
                FROM cls
                GROUP BY range
                ORDER BY CASE range
                            WHEN '0-30' THEN 1
                            WHEN '31-60' THEN 2
                            WHEN '61-90' THEN 3
                            ELSE 4
                         END
                """;
        Query q = em.createNativeQuery(sql);
        return mapAging(q);
    }

    public List<InvoiceStatusTrendPoint> getInvoiceStatusTrend(LocalDate fromDate, LocalDate toDate, ChartGranularity gran) {
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
                  SELECT date_trunc('%s', i.created_at) AS bucket,
                         SUM(CASE WHEN i.status='Draft' THEN 1 ELSE 0 END)::bigint AS draft,
                         SUM(CASE WHEN i.status='Issued' THEN 1 ELSE 0 END)::bigint AS issued,
                         SUM(CASE WHEN i.status='Canceled' THEN 1 ELSE 0 END)::bigint AS canceled,
                         COALESCE(SUM(CASE WHEN i.status='Issued' THEN i.total_amount ELSE 0 END), 0) AS total_amount_issued
                  FROM invoices i
                  WHERE i.created_at >= CAST(:fromDate AS timestamp)
                    AND i.created_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                  GROUP BY date_trunc('%s', i.created_at)
                )
                SELECT b.bucket::date,
                       COALESCE(a.draft, 0),
                       COALESCE(a.issued, 0),
                       COALESCE(a.canceled, 0),
                       COALESCE(a.total_amount_issued, 0)
                FROM buckets b LEFT JOIN agg a ON a.bucket = b.bucket
                ORDER BY b.bucket
                """.formatted(unit, unit, p.granularity.getInterval(), unit, unit);
        Query q = em.createNativeQuery(sql);
        q.setParameter("fromDate", p.from);
        q.setParameter("toDate", p.to);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        List<InvoiceStatusTrendPoint> out = new ArrayList<>();
        for (Object[] r : rows) {
            out.add(InvoiceStatusTrendPoint.builder()
                    .bucket(ChartUtils.toLocalDate(r[0]))
                    .draft(ChartUtils.toLong(r[1]))
                    .issued(ChartUtils.toLong(r[2]))
                    .canceled(ChartUtils.toLong(r[3]))
                    .totalAmountIssued(ChartUtils.toBigDecimal(r[4]))
                    .build());
        }
        return out;
    }

    public List<NamedValuePoint> getTopSuppliersDebt(int limit) {
        int top = Math.max(1, Math.min(50, limit));
        String sql = """
                SELECT s.name, COALESCE(s.total_debt, 0), 1::bigint
                FROM suppliers s
                WHERE s.total_debt > 0
                ORDER BY s.total_debt DESC
                LIMIT :top
                """;
        Query q = em.createNativeQuery(sql);
        q.setParameter("top", top);
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

    private List<AgingBucket> mapAging(Query q) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        List<AgingBucket> out = new ArrayList<>();
        for (Object[] r : rows) {
            String bucketKey = r[0] != null ? r[0].toString() : null;
            out.add(AgingBucket.builder()
                    .range(AgingBucketLabels.toVietnamese(bucketKey))
                    .amount(ChartUtils.toBigDecimal(r[1]))
                    .count(ChartUtils.toLong(r[2]))
                    .build());
        }
        return out;
    }
}
