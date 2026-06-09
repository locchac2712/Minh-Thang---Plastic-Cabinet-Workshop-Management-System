package com.tuplastic.erp.director.service;

import com.tuplastic.erp.director.dto.*;
import com.tuplastic.erp.reconcile.AgencyDebtComputationService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final EntityManager em;
    private final AgencyDebtComputationService agencyDebtComputationService;

    public List<RevenueReportItem> getRevenueReport(LocalDate fromDate, LocalDate toDate) {
        String sql = """
                SELECT TO_CHAR(o.created_at, 'YYYY-MM') AS period,
                       COUNT(*) AS order_count,
                       COALESCE(SUM(o.total_payable), 0) AS total_revenue
                FROM orders o
                WHERE o.status = 'Done'
                  AND (:fromDate IS NULL OR o.created_at >= CAST(:fromDate AS TIMESTAMP))
                  AND (:toDate IS NULL OR o.created_at < CAST(:toDate AS TIMESTAMP) + INTERVAL '1 day')
                GROUP BY TO_CHAR(o.created_at, 'YYYY-MM')
                ORDER BY period
                """;

        Query query = em.createNativeQuery(sql);
        query.setParameter("fromDate", fromDate);
        query.setParameter("toDate", toDate);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        return rows.stream().map(r -> new RevenueReportItem(
                (String) r[0],
                ((Number) r[1]).longValue(),
                toBigDecimal(r[2])
        )).toList();
    }

    public GrossMarginReport getGrossMarginReport(LocalDate fromDate, LocalDate toDate) {
        String sql = """
                SELECT COUNT(DISTINCT o.id) AS order_count,
                       COALESCE(SUM(oi.unit_price * oi.quantity), 0) AS total_revenue,
                       COALESCE(SUM(oi.unit_cost_at_time * oi.quantity), 0) AS total_cost
                FROM orders o
                JOIN order_items oi ON oi.order_id = o.id
                WHERE o.status = 'Done'
                  AND (:fromDate IS NULL OR o.created_at >= CAST(:fromDate AS TIMESTAMP))
                  AND (:toDate IS NULL OR o.created_at < CAST(:toDate AS TIMESTAMP) + INTERVAL '1 day')
                """;

        Query query = em.createNativeQuery(sql);
        query.setParameter("fromDate", fromDate);
        query.setParameter("toDate", toDate);

        Object[] r = (Object[]) query.getSingleResult();
        BigDecimal revenue = toBigDecimal(r[1]);
        BigDecimal cost = toBigDecimal(r[2]);
        BigDecimal margin = revenue.subtract(cost);
        BigDecimal percent = revenue.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : margin.multiply(BigDecimal.valueOf(100)).divide(revenue, 2, RoundingMode.HALF_UP);

        return GrossMarginReport.builder()
                .orderCount(((Number) r[0]).longValue())
                .totalRevenue(revenue)
                .totalCost(cost)
                .grossMargin(margin)
                .marginPercent(percent)
                .build();
    }

    public List<DebtReportItem> getAgencyDebtsReport() {
        String sql = """
                SELECT id, name, total_debt, max_debt_limit, is_active
                FROM agencies
                WHERE total_debt > 0
                ORDER BY total_debt DESC
                """;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        Map<UUID, BigDecimal> computedByAgency = agencyDebtComputationService.computeAllAgencies();
        return rows.stream().map(r -> {
            UUID id = (UUID) r[0];
            BigDecimal recorded = toBigDecimal(r[2]);
            BigDecimal computed = computedByAgency.getOrDefault(id, BigDecimal.ZERO);
            DebtReportItem item = new DebtReportItem();
            item.setId(id);
            item.setName((String) r[1]);
            item.setTotalDebt(recorded);
            item.setComputedDebtFromOrders(computed);
            item.setDebtReconciliationDelta(agencyDebtComputationService.reconciliationDelta(recorded, computed));
            item.setMaxDebtLimit(toBigDecimal(r[3]));
            item.setIsActive((Boolean) r[4]);
            return item;
        }).toList();
    }

    public List<SupplierDebtReportItem> getSupplierDebtsReport() {
        String sql = """
                SELECT id, name, total_debt, is_active
                FROM suppliers
                WHERE total_debt > 0
                ORDER BY total_debt DESC
                """;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        return rows.stream().map(r -> new SupplierDebtReportItem(
                (UUID) r[0],
                (String) r[1],
                toBigDecimal(r[2]),
                (Boolean) r[3]
        )).toList();
    }

    public List<DiscountReportItem> getDiscountAllocationsReport(LocalDate fromDate, LocalDate toDate) {
        String sql = """
                SELECT u.id AS seller_id,
                       u.full_name AS seller_name,
                       COUNT(*) AS order_count,
                       COALESCE(SUM(o.discount_amount), 0) AS total_discount
                FROM orders o
                JOIN users u ON u.id = o.created_by
                WHERE o.status = 'Done'
                  AND o.discount_amount > 0
                  AND (:fromDate IS NULL OR o.created_at >= CAST(:fromDate AS TIMESTAMP))
                  AND (:toDate IS NULL OR o.created_at < CAST(:toDate AS TIMESTAMP) + INTERVAL '1 day')
                GROUP BY u.id, u.full_name
                ORDER BY total_discount DESC
                """;

        Query query = em.createNativeQuery(sql);
        query.setParameter("fromDate", fromDate);
        query.setParameter("toDate", toDate);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        return rows.stream().map(r -> new DiscountReportItem(
                (UUID) r[0],
                (String) r[1],
                ((Number) r[2]).longValue(),
                toBigDecimal(r[3])
        )).toList();
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        return new BigDecimal(value.toString());
    }
}
