package com.tuplastic.erp.production.service;

import com.tuplastic.erp.production.dto.*;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShopFloorPerformanceService {

    private final EntityManager em;
    private final ProductionTaskRepository taskRepository;

    public ShopFloorPerformanceReport getReport(LocalDate fromDate, LocalDate toDate) {
        ShopFloorKpiSummary kpi = loadKpi(fromDate, toDate);
        WipSnapshot wip = loadWip();
        List<ShopFloorThroughputItem> throughput = loadThroughputByMonth(fromDate, toDate);
        List<ShopFloorAssigneeStats> byAssignee = loadByAssignee(fromDate, toDate);
        return ShopFloorPerformanceReport.builder()
                .fromDate(fromDate)
                .toDate(toDate)
                .kpi(kpi)
                .wip(wip)
                .throughputByMonth(throughput)
                .byAssignee(byAssignee)
                .build();
    }

    /** KPI tổng hợp trong 30 ngày gần (kể từ toDate, mặc định hôm nay) — dùng dashboard. */
    public ShopFloorKpiSummary getKpiLast30Days(LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        return loadKpi(end.minusDays(29), end);
    }

    @SuppressWarnings("unchecked")
    private ShopFloorKpiSummary loadKpi(LocalDate fromDate, LocalDate toDate) {
        DateFilter completedFilter = completedAtDateFilter(fromDate, toDate);
        String sql = """
                WITH d AS (
                    SELECT t.id,
                           t.expected_end_date,
                           t.completed_at,
                           t.status
                    FROM production_tasks t
                    WHERE t.status = 'Done'
                      AND t.completed_at IS NOT NULL
                """ + completedFilter.sqlSuffix() + """
                )
                SELECT COUNT(*)::bigint AS done_total,
                       COUNT(*) FILTER (WHERE expected_end_date IS NOT NULL)::bigint AS with_expected,
                       COUNT(*) FILTER (WHERE expected_end_date IS NOT NULL
                           AND CAST(completed_at AS date) <= expected_end_date)::bigint AS on_time,
                       COUNT(*) FILTER (WHERE expected_end_date IS NOT NULL
                           AND CAST(completed_at AS date) > expected_end_date)::bigint AS late,
                       COUNT(*) FILTER (WHERE expected_end_date IS NULL)::bigint AS no_expected,
                       COALESCE(AVG((CAST(completed_at AS date) - expected_end_date)) FILTER (
                           WHERE expected_end_date IS NOT NULL
                             AND CAST(completed_at AS date) > expected_end_date
                       ), 0) AS avg_delay
                FROM d
                """;

        Query q = em.createNativeQuery(sql);
        completedFilter.bind(q);
        Object[] r = (Object[]) q.getSingleResult();

        long withExpected = toLong(r[1]);
        long onTime = toLong(r[2]);
        BigDecimal onTimePct = withExpected == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(onTime).multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(withExpected), 2, RoundingMode.HALF_UP);
        return ShopFloorKpiSummary.builder()
                .doneCompletedInPeriod(toLong(r[0]))
                .doneWithExpectedDate(withExpected)
                .onTimeCount(onTime)
                .lateCount(toLong(r[3]))
                .doneWithoutExpectedCount(toLong(r[4]))
                .onTimePercent(onTimePct)
                .averageDelayDaysLate(scaleDelay(r[5]))
                .build();
    }

    private WipSnapshot loadWip() {
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (Object[] row : taskRepository.countGroupByStatus()) {
            byStatus.put((String) row[0], ((Number) row[1]).longValue());
        }
        long waiting = byStatus.getOrDefault("Waiting", 0L);
        long doing = byStatus.getOrDefault("Doing", 0L);
        WipQuantity q = loadWipQuantities();
        return WipSnapshot.builder()
                .waitingCount(waiting)
                .doingCount(doing)
                .waitingTotalQuantity(q.waitingQty)
                .doingTotalQuantity(q.doingQty)
                .countByStatus(byStatus)
                .build();
    }

    @SuppressWarnings("unchecked")
    private WipQuantity loadWipQuantities() {
        String sql = """
                SELECT t.status, COALESCE(SUM(t.quantity), 0) AS q
                FROM production_tasks t
                WHERE t.status IN ('Waiting', 'Doing')
                GROUP BY t.status
                """;
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        int w = 0, d = 0;
        for (Object[] row : rows) {
            String s = (String) row[0];
            int qty = ((Number) row[1]).intValue();
            if ("Waiting".equals(s)) w = qty;
            if ("Doing".equals(s)) d = qty;
        }
        return new WipQuantity(w, d);
    }

    @SuppressWarnings("unchecked")
    private List<ShopFloorThroughputItem> loadThroughputByMonth(LocalDate fromDate, LocalDate toDate) {
        DateFilter completedFilter = completedAtDateFilter(fromDate, toDate);
        String sql = """
                SELECT TO_CHAR(t.completed_at, 'YYYY-MM') AS period,
                       COUNT(*)::bigint AS done_cnt,
                       COALESCE(SUM(t.quantity::numeric), 0) AS total_q
                FROM production_tasks t
                WHERE t.status = 'Done'
                  AND t.completed_at IS NOT NULL
                """ + completedFilter.sqlSuffix() + """
                GROUP BY TO_CHAR(t.completed_at, 'YYYY-MM')
                ORDER BY period
                """;
        Query q = em.createNativeQuery(sql);
        completedFilter.bind(q);
        List<Object[]> rows = q.getResultList();
        return rows.stream()
                .map(r -> ShopFloorThroughputItem.builder()
                        .period((String) r[0])
                        .doneTaskCount(toLong(r[1]))
                        .totalQuantity(toBigDecimal(r[2]))
                        .build())
                .toList();
    }

    @SuppressWarnings("unchecked")
    private List<ShopFloorAssigneeStats> loadByAssignee(LocalDate fromDate, LocalDate toDate) {
        DateFilter completedFilter = completedAtDateFilter(fromDate, toDate);
        String sql = """
                SELECT u.id, u.full_name,
                       COUNT(*)::bigint,
                       COUNT(*) FILTER (WHERE t.expected_end_date IS NOT NULL)::bigint,
                       COUNT(*) FILTER (WHERE t.expected_end_date IS NOT NULL
                           AND CAST(t.completed_at AS date) <= t.expected_end_date)::bigint,
                       COALESCE(SUM(t.quantity), 0) AS q
                FROM production_tasks t
                LEFT JOIN users u ON u.id = t.assigned_to
                WHERE t.status = 'Done'
                  AND t.completed_at IS NOT NULL
                """ + completedFilter.sqlSuffix() + """
                GROUP BY u.id, u.full_name
                ORDER BY COUNT(*) DESC
                """;
        Query q = em.createNativeQuery(sql);
        completedFilter.bind(q);
        List<Object[]> rows = q.getResultList();
        return rows.stream().map(this::toAssigneeStats).toList();
    }

    private ShopFloorAssigneeStats toAssigneeStats(Object[] r) {
        long withE = toLong(r[3]);
        long onT = toLong(r[4]);
        BigDecimal pct = withE == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(onT).multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(withE), 2, RoundingMode.HALF_UP);
        UUID id = r[0] != null ? (UUID) r[0] : null;
        return ShopFloorAssigneeStats.builder()
                .userId(id)
                .fullName(r[1] != null ? (String) r[1] : "—")
                .doneCount(toLong(r[2]))
                .withExpectedCount(withE)
                .onTimeCount(onT)
                .onTimePercent(pct)
                .totalDoneQuantity(r[5] != null ? ((Number) r[5]).intValue() : 0)
                .build();
    }

    private long toLong(Object o) {
        if (o == null) return 0L;
        return ((Number) o).longValue();
    }

    private BigDecimal toBigDecimal(Object o) {
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal b) return b;
        return new BigDecimal(o.toString());
    }

    private BigDecimal scaleDelay(Object o) {
        BigDecimal v = toBigDecimal(o);
        if (v.compareTo(BigDecimal.ZERO) == 0) return v;
        return v.setScale(2, RoundingMode.HALF_UP);
    }

    private record WipQuantity(int waitingQty, int doingQty) {}

    /**
     * Chỉ bind param ngày khi non-null — tránh Postgres
     * {@code could not determine data type of parameter} với {@code :x IS NULL OR ...}.
     */
    private DateFilter completedAtDateFilter(LocalDate fromDate, LocalDate toDate) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new HashMap<>();
        if (fromDate != null) {
            sql.append(" AND CAST(t.completed_at AS date) >= CAST(:fromDate AS date)");
            params.put("fromDate", fromDate);
        }
        if (toDate != null) {
            sql.append(" AND CAST(t.completed_at AS date) <= CAST(:toDate AS date)");
            params.put("toDate", toDate);
        }
        return new DateFilter(sql.toString(), params);
    }

    private record DateFilter(String sqlSuffix, Map<String, Object> params) {
        void bind(Query query) {
            params.forEach(query::setParameter);
        }
    }
}
