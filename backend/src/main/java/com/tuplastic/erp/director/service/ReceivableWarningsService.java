package com.tuplastic.erp.director.service;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.director.dto.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Cảnh báo nợ phải thu (Director) — heuristic không đổi schema:
 * anchor = COALESCE(expected_delivery_date, ngày theo TZ VN của updated_at, created_at).
 * dueDate = anchor + {@code dueGraceDays}.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReceivableWarningsService {

    public static final String RISK_SERIOUS = "SERIOUS";
    public static final String RISK_HIGH = "HIGH";
    public static final String RISK_MONITOR = "MONITOR";

    public static final String BUCKET_CURRENT = "CURRENT";
    public static final String BUCKET_1_30 = "DAYS_1_30";
    public static final String BUCKET_31_60 = "DAYS_31_60";
    public static final String BUCKET_61_90 = "DAYS_61_90";
    public static final String BUCKET_OVER_90 = "DAYS_OVER_90";

    private static final List<String> WORST_FIRST = List.of(
            BUCKET_OVER_90, BUCKET_61_90, BUCKET_31_60, BUCKET_1_30, BUCKET_CURRENT);

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final EntityManager em;

    @Value("${app.receivables.warning.due-grace-days:30}")
    private int dueGraceDays;

    public ReceivableWarningsSummaryDto getSummary(int topLimit, String riskFilter, LocalDate today, boolean onlyActive) {
        LocalDate asOf = today != null ? today : LocalDate.now(VN);
        String riskNorm = normalizeRisk(riskFilter);

        List<AgencyScratch> all = buildAgencyScratchList(onlyActive, asOf).stream()
                .filter(a -> a.totalDebt.compareTo(BigDecimal.ZERO) > 0)
                .toList();
        List<AgencyScratch> filtered = riskNorm == null
                ? all
                : all.stream().filter(a -> riskNorm.equals(a.riskBand)).toList();

        int n = Math.max(1, Math.min(topLimit, 500));
        List<AgencyScratch> cohort = filtered.stream()
                .sorted(Comparator.comparing((AgencyScratch a) -> a.totalDebt).reversed())
                .limit(n)
                .toList();

        BigDecimal totalRecorded = cohort.stream()
                .map(a -> a.totalDebt)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal estOverdue = cohort.stream()
                .map(a -> a.estimatedOverdueFromOrders)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long urgent = cohort.stream().filter(a -> RISK_SERIOUS.equals(a.riskBand)).count();

        Map<String, Long> riskCount = cohort.stream()
                .collect(Collectors.groupingBy(a -> a.riskBand, Collectors.counting()));

        List<ReceivableRiskCountDto> riskCounts = List.of(
                new ReceivableRiskCountDto(RISK_SERIOUS, riskCount.getOrDefault(RISK_SERIOUS, 0L)),
                new ReceivableRiskCountDto(RISK_HIGH, riskCount.getOrDefault(RISK_HIGH, 0L)),
                new ReceivableRiskCountDto(RISK_MONITOR, riskCount.getOrDefault(RISK_MONITOR, 0L)));

        int sumMax = cohort.stream().mapToInt(a -> a.maxOverdueDays).sum();
        int cohortMax = cohort.stream().mapToInt(a -> a.maxOverdueDays).max().orElse(0);
        BigDecimal avgMax = cohort.isEmpty()
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(sumMax)
                .divide(BigDecimal.valueOf(cohort.size()), 1, RoundingMode.HALF_UP);

        return ReceivableWarningsSummaryDto.builder()
                .summaryDate(asOf)
                .dueGraceDaysApplied(dueGraceDays)
                .cohortAgencyCount(cohort.size())
                .topLimitUsed(n)
                .totalReceivableRecorded(totalRecorded)
                .estimatedOverdueFromOrders(estOverdue)
                .urgentAgencyCount(urgent)
                .riskCounts(riskCounts)
                .averageAgencyMaxOverdueDays(avgMax)
                .cohortMaxOverdueDays(cohortMax)
                .build();
    }

    public PageResponse<ReceivableWarningsAgencyRowDto> listAgencies(
            String search,
            String riskFilter,
            String bucketFilter,
            Integer minOverdueDays,
            boolean onlyActive,
            LocalDate today,
            int page,
            int size) {

        LocalDate asOf = today != null ? today : LocalDate.now(VN);
        validateBucket(bucketFilter);
        String riskNorm = normalizeRisk(riskFilter);
        String bucketNorm = normalizeBucket(bucketFilter);

        List<ReceivableWarningsAgencyRowDto> rows = buildAgencyScratchList(onlyActive, asOf).stream()
                .filter(a -> a.totalDebt.compareTo(BigDecimal.ZERO) > 0)
                .map(this::toRowDto)
                .filter(r -> riskNorm == null || riskNorm.equals(r.getRiskBand()))
                .filter(r -> bucketNorm == null || bucketNorm.equals(r.getPrimaryAgingBucket()))
                .filter(r -> minOverdueDays == null || r.getMaxOverdueDays() >= minOverdueDays)
                .filter(r -> matchesSearch(r, search))
                .sorted(Comparator.comparing(ReceivableWarningsAgencyRowDto::getTotalDebt).reversed())
                .toList();

        int p = Math.max(0, page);
        int sz = Math.max(1, Math.min(size, 200));
        int from = p * sz;
        int to = Math.min(from + sz, rows.size());
        List<ReceivableWarningsAgencyRowDto> slice = from >= rows.size() ? List.of() : rows.subList(from, to);
        int totalPages = sz == 0 ? 0 : (int) Math.ceil((double) rows.size() / sz);

        return PageResponse.<ReceivableWarningsAgencyRowDto>builder()
                .content(slice)
                .page(p)
                .size(sz)
                .totalElements(rows.size())
                .totalPages(totalPages)
                .last(to >= rows.size())
                .build();
    }

    public ReceivableWarningsAgencyDetailDto getAgencyDetail(UUID agencyId, LocalDate today) {
        LocalDate asOf = today != null ? today : LocalDate.now(VN);

        AgencyScratch base = loadOneAgency(agencyId).orElseThrow(() ->
                new ResourceNotFoundException("Đại lý", "id", agencyId));

        List<OrderScratch> orders = loadOrdersForAgency(agencyId, asOf);
        applyOrdersToScratch(base, orders);

        BigDecimal sumRemainingOrders = orders.stream()
                .map(o -> o.remaining)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> pct = new LinkedHashMap<>();
        for (String k : List.of(BUCKET_CURRENT, BUCKET_1_30, BUCKET_31_60, BUCKET_61_90, BUCKET_OVER_90)) {
            BigDecimal amt = base.bucketAmounts.getOrDefault(k, BigDecimal.ZERO);
            BigDecimal pc = BigDecimal.ZERO;
            if (sumRemainingOrders.compareTo(BigDecimal.ZERO) > 0) {
                pc = amt.multiply(HUNDRED).divide(sumRemainingOrders, 1, RoundingMode.HALF_UP);
            }
            pct.put(k, pc);
        }

        BigDecimal ratioVsRecorded = BigDecimal.ZERO;
        if (base.totalDebt.compareTo(BigDecimal.ZERO) > 0) {
            ratioVsRecorded = base.estimatedOverdueFromOrders
                    .multiply(HUNDRED)
                    .divide(base.totalDebt, 1, RoundingMode.HALF_UP);
        }

        LocalDate oldest = orders.stream()
                .map(o -> o.anchorDate)
                .min(Comparator.naturalOrder())
                .orElse(null);

        List<ReceivableContributingOrderDto> contribs = orders.stream()
                .sorted(Comparator.<OrderScratch>comparingInt(o -> o.overdueDays).reversed()
                        .thenComparing((OrderScratch o) -> o.remaining).reversed())
                .map(o -> ReceivableContributingOrderDto.builder()
                        .orderId(o.orderId)
                        .remainingAmount(o.remaining)
                        .anchorDate(o.anchorDate)
                        .dueDate(o.dueDate)
                        .overdueDays(o.overdueDays)
                        .agingBucket(o.bucket)
                        .build())
                .toList();

        return ReceivableWarningsAgencyDetailDto.builder()
                .agencyId(base.id)
                .name(base.name)
                .legalCompanyName(base.legalCompanyName)
                .address(base.address)
                .taxCode(base.taxCode)
                .assignedSellerId(base.sellerId)
                .assignedSellerName(base.sellerName)
                .totalDebtRecorded(base.totalDebt)
                .maxDebtLimit(base.maxDebtLimit)
                .utilizationPercent(utilizationPercent(base.totalDebt, base.maxDebtLimit))
                .riskBand(base.riskBand)
                .oldestAnchorDateAmongOrders(oldest)
                .overdueRatioVsRecordedDebt(ratioVsRecorded)
                .agingBuckets(Map.copyOf(base.bucketAmounts))
                .agingBucketPercents(pct)
                .maxOverdueDays(base.maxOverdueDays)
                .contributingOrders(contribs)
                .build();
    }

    private Optional<AgencyScratch> loadOneAgency(UUID id) {
        String sql = """
                SELECT a.id, a.name, a.legal_company_name, a.address, a.tax_code,
                       a.total_debt, a.max_debt_limit, a.is_active, a.assigned_seller_id, u.full_name
                FROM agencies a
                LEFT JOIN users u ON u.id = a.assigned_seller_id
                WHERE a.id = :id
                """;
        Query q = em.createNativeQuery(sql);
        q.setParameter("id", id);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(toScratch(rows.get(0)));
    }

    private List<OrderScratch> loadOrdersForAgency(UUID agencyId, LocalDate asOf) {
        String sql = """
                SELECT o.id, o.total_payable, o.paid_amount, o.expected_delivery_date, o.updated_at, o.created_at
                FROM orders o
                WHERE o.agency_id = :agencyId
                  AND o.status = 'Done'
                """;
        Query q = em.createNativeQuery(sql);
        q.setParameter("agencyId", agencyId);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        List<OrderScratch> out = new ArrayList<>();
        for (Object[] r : rows) {
            UUID oid = (UUID) r[0];
            BigDecimal tp = toBd(r[1]);
            BigDecimal paid = toBd(r[2]);
            BigDecimal remaining = tp.subtract(paid);
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            LocalDate anchor = resolveAnchor((Date) r[3], (Timestamp) r[4], (Timestamp) r[5]);
            LocalDate due = anchor.plusDays(dueGraceDays);
            int overdue = (int) Math.max(0, ChronoUnit.DAYS.between(due, asOf));
            String bucket = classifyBucket(overdue);
            out.add(new OrderScratch(oid, remaining, anchor, due, overdue, bucket));
        }
        return out;
    }

    private void applyOrdersToScratch(AgencyScratch a, List<OrderScratch> orders) {
        a.bucketAmounts.clear();
        a.maxOverdueDays = 0;
        a.estimatedOverdueFromOrders = BigDecimal.ZERO;
        for (OrderScratch o : orders) {
            a.bucketAmounts.merge(o.bucket, o.remaining, BigDecimal::add);
            a.maxOverdueDays = Math.max(a.maxOverdueDays, o.overdueDays);
            if (o.overdueDays > 0) {
                a.estimatedOverdueFromOrders = a.estimatedOverdueFromOrders.add(o.remaining);
            }
        }
        ensureAllBucketKeys(a.bucketAmounts);
        a.primaryBucket = pickPrimaryWorstBucket(a.bucketAmounts);
        a.riskBand = classifyRiskBand(a.totalDebt, a.maxDebtLimit, a.maxOverdueDays);
    }

    private List<AgencyScratch> buildAgencyScratchList(boolean onlyActive, LocalDate asOf) {
        String sql = """
                SELECT a.id, a.name, a.legal_company_name, a.address, a.tax_code,
                       a.total_debt, a.max_debt_limit, a.is_active, a.assigned_seller_id, u.full_name
                FROM agencies a
                LEFT JOIN users u ON u.id = a.assigned_seller_id
                """;
        if (onlyActive) {
            sql += " WHERE COALESCE(a.is_active, TRUE) = TRUE ";
        }
        sql += " ORDER BY a.total_debt DESC ";

        Query q = em.createNativeQuery(sql);
        @SuppressWarnings("unchecked")
        List<Object[]> agencyRows = q.getResultList();

        Map<UUID, List<OrderScratch>> orderMap = loadAllDoneOrdersWithRemainderGrouped(asOf);

        List<AgencyScratch> result = new ArrayList<>();
        for (Object[] row : agencyRows) {
            AgencyScratch s = toScratch(row);
            List<OrderScratch> ords = orderMap.getOrDefault(s.id, List.of());
            applyOrdersToScratch(s, ords);
            result.add(s);
        }
        return result;
    }

    private Map<UUID, List<OrderScratch>> loadAllDoneOrdersWithRemainderGrouped(LocalDate asOf) {
        String sql = """
                SELECT o.id, o.agency_id, o.total_payable, o.paid_amount, o.expected_delivery_date, o.updated_at, o.created_at
                FROM orders o
                WHERE o.status = 'Done'
                """;
        Query q = em.createNativeQuery(sql);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        Map<UUID, List<OrderScratch>> map = new HashMap<>();
        for (Object[] r : rows) {
            UUID agencyId = (UUID) r[1];
            BigDecimal tp = toBd(r[2]);
            BigDecimal paid = toBd(r[3]);
            BigDecimal remaining = tp.subtract(paid);
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            UUID oid = (UUID) r[0];
            LocalDate anchor = resolveAnchor((Date) r[4], (Timestamp) r[5], (Timestamp) r[6]);
            LocalDate due = anchor.plusDays(dueGraceDays);
            int overdue = (int) Math.max(0, ChronoUnit.DAYS.between(due, asOf));
            String bucket = classifyBucket(overdue);
            map.computeIfAbsent(agencyId, k -> new ArrayList<>())
                    .add(new OrderScratch(oid, remaining, anchor, due, overdue, bucket));
        }
        return map;
    }

    private AgencyScratch toScratch(Object[] row) {
        AgencyScratch s = new AgencyScratch();
        s.id = (UUID) row[0];
        s.name = row[1] != null ? row[1].toString() : "";
        s.legalCompanyName = row[2] != null ? row[2].toString() : null;
        s.address = row[3] != null ? row[3].toString() : null;
        s.taxCode = row[4] != null ? row[4].toString() : null;
        s.totalDebt = toBd(row[5]);
        s.maxDebtLimit = toBd(row[6]);
        if (row[7] instanceof Boolean b) {
            s.isActive = b;
        } else if (row[7] != null) {
            s.isActive = Boolean.parseBoolean(row[7].toString());
        } else {
            s.isActive = true;
        }
        s.sellerId = row[8] != null ? (UUID) row[8] : null;
        s.sellerName = row[9] != null ? row[9].toString() : null;
        return s;
    }

    private ReceivableWarningsAgencyRowDto toRowDto(AgencyScratch a) {
        return ReceivableWarningsAgencyRowDto.builder()
                .agencyId(a.id)
                .name(a.name)
                .legalCompanyName(a.legalCompanyName)
                .address(a.address)
                .taxCode(a.taxCode)
                .assignedSellerId(a.sellerId)
                .assignedSellerName(a.sellerName)
                .totalDebt(a.totalDebt)
                .maxDebtLimit(a.maxDebtLimit)
                .utilizationPercent(utilizationPercent(a.totalDebt, a.maxDebtLimit))
                .estimatedOverdueAmount(a.estimatedOverdueFromOrders)
                .primaryAgingBucket(a.primaryBucket)
                .maxOverdueDays(a.maxOverdueDays)
                .riskBand(a.riskBand)
                .isActive(a.isActive)
                .build();
    }

    private boolean matchesSearch(ReceivableWarningsAgencyRowDto r, String search) {
        if (!StringUtils.hasText(search)) {
            return true;
        }
        String q = search.trim().toLowerCase(Locale.ROOT);
        if (r.getName() != null && r.getName().toLowerCase(Locale.ROOT).contains(q)) {
            return true;
        }
        if (r.getLegalCompanyName() != null && r.getLegalCompanyName().toLowerCase(Locale.ROOT).contains(q)) {
            return true;
        }
        if (r.getTaxCode() != null && r.getTaxCode().toLowerCase(Locale.ROOT).contains(q)) {
            return true;
        }
        if (r.getAddress() != null && r.getAddress().toLowerCase(Locale.ROOT).contains(q)) {
            return true;
        }
        String idPlain = r.getAgencyId().toString().toLowerCase(Locale.ROOT).replace("-", "");
        return idPlain.contains(q.replace("-", ""));
    }

    private LocalDate resolveAnchor(Date expectedSqlDate, Timestamp updated, Timestamp created) {
        if (expectedSqlDate != null) {
            return expectedSqlDate.toLocalDate();
        }
        if (updated != null) {
            return updated.toInstant().atZone(VN).toLocalDate();
        }
        if (created != null) {
            return created.toInstant().atZone(VN).toLocalDate();
        }
        return LocalDate.now(VN);
    }

    private String classifyBucket(int overdueDays) {
        if (overdueDays <= 0) {
            return BUCKET_CURRENT;
        }
        if (overdueDays <= 30) {
            return BUCKET_1_30;
        }
        if (overdueDays <= 60) {
            return BUCKET_31_60;
        }
        if (overdueDays <= 90) {
            return BUCKET_61_90;
        }
        return BUCKET_OVER_90;
    }

    private String pickPrimaryWorstBucket(Map<String, BigDecimal> buckets) {
        for (String k : WORST_FIRST) {
            if (buckets.getOrDefault(k, BigDecimal.ZERO).compareTo(BigDecimal.ZERO) > 0) {
                return k;
            }
        }
        return BUCKET_CURRENT;
    }

    /**
     * Rủi ro tổng hợp: utilization với ngưỡng 80%/100%; nâng bậc theo độ trễ đơn.
     */
    private String classifyRiskBand(BigDecimal totalDebt, BigDecimal maxLimit, int maxOverdueDays) {
        String band = RISK_MONITOR;
        BigDecimal lim = maxLimit != null ? maxLimit : BigDecimal.ZERO;
        if (lim.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal ratio = totalDebt.divide(lim, 8, RoundingMode.HALF_UP);
            if (totalDebt.compareTo(lim) >= 0 || ratio.compareTo(BigDecimal.ONE) >= 0) {
                band = RISK_SERIOUS;
            } else if (ratio.multiply(HUNDRED).compareTo(new BigDecimal("80")) >= 0) {
                band = RISK_HIGH;
            }
        } else if (totalDebt.compareTo(BigDecimal.ZERO) > 0) {
            band = RISK_MONITOR;
        }

        if (maxOverdueDays >= 120) {
            return RISK_SERIOUS;
        }
        if (maxOverdueDays >= 90 && RISK_MONITOR.equals(band)) {
            return RISK_HIGH;
        }
        return band;
    }

    private BigDecimal utilizationPercent(BigDecimal debt, BigDecimal limit) {
        if (limit == null || limit.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        return debt.multiply(HUNDRED).divide(limit, 1, RoundingMode.HALF_UP);
    }

    private BigDecimal toBd(Object v) {
        if (v == null) {
            return BigDecimal.ZERO;
        }
        if (v instanceof BigDecimal b) {
            return b;
        }
        return new BigDecimal(v.toString());
    }

    private void ensureAllBucketKeys(Map<String, BigDecimal> m) {
        for (String k : List.of(BUCKET_CURRENT, BUCKET_1_30, BUCKET_31_60, BUCKET_61_90, BUCKET_OVER_90)) {
            m.putIfAbsent(k, BigDecimal.ZERO);
        }
    }

    private String normalizeRisk(String risk) {
        if (!StringUtils.hasText(risk) || "ALL".equalsIgnoreCase(risk.trim())) {
            return null;
        }
        String u = risk.trim().toUpperCase(Locale.ROOT);
        if (!List.of(RISK_SERIOUS, RISK_HIGH, RISK_MONITOR).contains(u)) {
            throw new BadRequestException("risk không hợp lệ. Chấp nhận: SERIOUS, HIGH, MONITOR, ALL");
        }
        return u;
    }

    private void validateBucket(String bucket) {
        if (!StringUtils.hasText(bucket)) {
            return;
        }
        normalizeBucket(bucket);
    }

    private String normalizeBucket(String bucket) {
        if (!StringUtils.hasText(bucket)) {
            return null;
        }
        String u = bucket.trim().toUpperCase(Locale.ROOT);
        if (!List.of(BUCKET_CURRENT, BUCKET_1_30, BUCKET_31_60, BUCKET_61_90, BUCKET_OVER_90).contains(u)) {
            throw new BadRequestException(
                    "bucket không hợp lệ. Chấp nhận: CURRENT, DAYS_1_30, DAYS_31_60, DAYS_61_90, DAYS_OVER_90");
        }
        return u;
    }

    private static final class AgencyScratch {
        UUID id;
        String name;
        String legalCompanyName;
        String address;
        String taxCode;
        BigDecimal totalDebt = BigDecimal.ZERO;
        BigDecimal maxDebtLimit = BigDecimal.ZERO;
        boolean isActive = true;
        UUID sellerId;
        String sellerName;

        final Map<String, BigDecimal> bucketAmounts = new LinkedHashMap<>();
        BigDecimal estimatedOverdueFromOrders = BigDecimal.ZERO;
        int maxOverdueDays;
        String primaryBucket = BUCKET_CURRENT;
        String riskBand = RISK_MONITOR;
    }

    private static final class OrderScratch {
        final UUID orderId;
        final BigDecimal remaining;
        final LocalDate anchorDate;
        final LocalDate dueDate;
        final int overdueDays;
        final String bucket;

        OrderScratch(UUID orderId, BigDecimal remaining, LocalDate anchorDate, LocalDate dueDate,
                     int overdueDays, String bucket) {
            this.orderId = orderId;
            this.remaining = remaining;
            this.anchorDate = anchorDate;
            this.dueDate = dueDate;
            this.overdueDays = overdueDays;
            this.bucket = bucket;
        }
    }
}
