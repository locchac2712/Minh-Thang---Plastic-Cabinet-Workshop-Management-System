package com.tuplastic.erp.director.service;

import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.director.dto.*;
import com.tuplastic.erp.director.entity.DirectorWasteTeamRemark;
import com.tuplastic.erp.director.enums.WasteSeverity;
import com.tuplastic.erp.director.repository.DirectorWasteTeamRemarkRepository;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DirectorWasteService {

    private static final BigDecimal SEV_CRITICAL_DAMAGE = new BigDecimal("40000000");
    private static final BigDecimal SEV_HIGH_DAMAGE = new BigDecimal("15000000");
    private static final BigDecimal SEV_WATCH_DAMAGE = new BigDecimal("3000000");
    private static final int SEV_CRITICAL_EVENTS = 25;
    private static final int SEV_HIGH_EVENTS = 12;
    private static final int SEV_WATCH_EVENTS = 4;

    private final EntityManager em;
    private final DirectorWasteTeamRemarkRepository remarkRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    public DirectorWasteSummaryResponse getSummary(LocalDate fromDate, LocalDate toDate) {
        validatePeriod(fromDate, toDate);
        List<DirectorWasteTeamRow> teams = loadTeamAggregates(fromDate, toDate, null, null);
        BigDecimal damage = teams.stream()
                .map(DirectorWasteTeamRow::getEstimatedDamageVnd)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long events = teams.stream().mapToLong(DirectorWasteTeamRow::getEventCount).sum();
        BigDecimal boards = teams.stream()
                .map(DirectorWasteTeamRow::getBoardEquivalent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long needAction = teams.stream()
                .filter(t -> t.getSeverity() == WasteSeverity.CRITICAL || t.getSeverity() == WasteSeverity.HIGH)
                .count();
        return DirectorWasteSummaryResponse.builder()
                .estimatedDamageVnd(damage)
                .wasteEventCount(events)
                .discardedBoardEquivalent(boards)
                .teamsNeedingActionCount(needAction)
                .build();
    }

    public List<DirectorWasteTeamRow> getTeams(LocalDate fromDate, LocalDate toDate,
                                               WasteSeverity severity, String search) {
        validatePeriod(fromDate, toDate);
        String searchPattern = buildSearchPattern(search);
        List<DirectorWasteTeamRow> rows = loadTeamAggregates(fromDate, toDate, severity, searchPattern);
        int rank = 1;
        for (DirectorWasteTeamRow r : rows) {
            r.setRank(rank++);
        }
        return rows;
    }

    public DirectorWasteTeamDetailsResponse getTeamDetails(UUID teamUserId, LocalDate fromDate, LocalDate toDate) {
        validatePeriod(fromDate, toDate);
        userRepository.findById(teamUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        List<DirectorWasteTeamRow> teams = loadTeamAggregates(fromDate, toDate, null, null);
        DirectorWasteTeamRow meta = teams.stream()
                .filter(t -> t.getTeamUserId().equals(teamUserId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không có dữ liệu hao phí gắn task cho PIC trong kỳ"));

        List<DirectorWasteMaterialRow> materials = loadMaterialBreakdown(teamUserId, fromDate, toDate);
        String remark = remarkRepository
                .findByPeriodFromAndPeriodToAndTeamUser_Id(fromDate, toDate, teamUserId)
                .map(DirectorWasteTeamRemark::getRemark)
                .orElse(null);

        DirectorWasteMaterialRow top = materials.stream()
                .max(Comparator.comparing(DirectorWasteMaterialRow::getDamageVnd))
                .orElse(null);

        LocalDateTime latest = loadLatestEventAt(teamUserId, fromDate, toDate);

        return DirectorWasteTeamDetailsResponse.builder()
                .teamUserId(teamUserId)
                .picName(meta.getPicName())
                .teamLabel(meta.getTeamLabel())
                .areaLabel(meta.getAreaLabel())
                .latestEventAt(latest)
                .topMaterialCode(top != null ? top.getMaterialCode() : null)
                .topMaterialName(top != null ? top.getMaterialName() : null)
                .equivalentAreaSqm(null)
                .materialRows(materials)
                .remark(remark)
                .build();
    }

    @Transactional
    public void saveRemark(UUID teamUserId, LocalDate fromDate, LocalDate toDate, DirectorWasteRemarkRequest request) {
        validatePeriod(fromDate, toDate);
        User teamUser = userRepository.findById(teamUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        User director = securityUtils.getCurrentUser();

        DirectorWasteTeamRemark entity = remarkRepository
                .findByPeriodFromAndPeriodToAndTeamUser_Id(fromDate, toDate, teamUserId)
                .orElse(DirectorWasteTeamRemark.builder()
                        .periodFrom(fromDate)
                        .periodTo(toDate)
                        .teamUser(teamUser)
                        .build());
        entity.setRemark(request.getRemark());
        entity.setUpdatedBy(director);
        entity.setUpdatedAt(LocalDateTime.now());
        remarkRepository.save(entity);
    }

    private void validatePeriod(LocalDate fromDate, LocalDate toDate) {
        if (fromDate == null || toDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bắt buộc from_date và to_date (ISO YYYY-MM-DD).");
        }
        if (fromDate.isAfter(toDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "from_date không được sau to_date.");
        }
    }

    private String buildSearchPattern(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        String t = search.trim();
        if (t.isEmpty()) {
            return null;
        }
        return "%" + t.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }

    /**
     * Gom theo assigned_to; searchPattern dùng với ESCAPE '\\' (ILIKE).
     */
    @SuppressWarnings("unchecked")
    private List<DirectorWasteTeamRow> loadTeamAggregates(LocalDate fromDate, LocalDate toDate,
                                                         WasteSeverity severityFilter,
                                                         String searchPattern) {
        PeriodPair prev = previousPeriod(fromDate, toDate);
        // Không bind null vào ILIKE — Postgres báo "could not determine data type of parameter".
        String searchFilter = (searchPattern == null)
                ? "TRUE"
                : """
                  (u.full_name ILIKE :searchPattern ESCAPE '\\'
                   OR u.username ILIKE :searchPattern ESCAPE '\\'
                   OR EXISTS (
                       SELECT 1 FROM lined l2
                       WHERE l2.team_user_id = l.team_user_id
                         AND (l2.material_code ILIKE :searchPattern ESCAPE '\\'
                              OR l2.material_name ILIKE :searchPattern ESCAPE '\\')
                   ))""";
        String sql = """
                WITH lined AS (
                    SELECT il.id,
                           il.task_id,
                           il.material_id,
                           il.quantity_change,
                           il.unit_price_at_time,
                           il.created_at,
                           pt.assigned_to AS team_user_id,
                           ABS(il.quantity_change) * COALESCE(il.unit_price_at_time, 0) AS line_cost,
                           ABS(il.quantity_change) AS qty_abs,
                           LOWER(TRIM(m.unit)) AS unit_norm,
                           m.code AS material_code,
                           m.name AS material_name
                    FROM inventory_logs il
                    INNER JOIN production_tasks pt ON pt.id = il.task_id
                    INNER JOIN materials m ON m.id = il.material_id
                    WHERE il.transaction_type = 'WASTE'
                      AND pt.assigned_to IS NOT NULL
                      AND il.created_at >= CAST(:fromDate AS timestamp)
                      AND il.created_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                ),
                per_task AS (
                    SELECT l.team_user_id,
                           pt.id AS task_id,
                           p.name AS product_name,
                           SUM(l.line_cost) AS task_damage
                    FROM lined l
                    INNER JOIN production_tasks pt ON pt.id = l.task_id
                    INNER JOIN products p ON p.id = pt.product_id
                    GROUP BY l.team_user_id, pt.id, p.name
                ),
                rep_task AS (
                    SELECT DISTINCT ON (team_user_id)
                           team_user_id,
                           product_name AS area_label
                    FROM per_task
                    ORDER BY team_user_id, task_damage DESC
                ),
                agg AS (
                    SELECT l.team_user_id,
                           u.full_name AS full_name,
                           u.username AS username,
                           SUM(l.line_cost) AS damage,
                           COUNT(*)::bigint AS events,
                           COALESCE(SUM(
                               CASE WHEN l.unit_norm IN ('tấm', 'tam') THEN l.qty_abs ELSE 0 END
                           ), 0) AS boards
                    FROM lined l
                    INNER JOIN users u ON u.id = l.team_user_id
                    WHERE %s
                    GROUP BY l.team_user_id, u.full_name, u.username
                )
                SELECT a.team_user_id, a.full_name, a.username, a.damage, a.events, a.boards,
                       COALESCE(rt.area_label, '') AS area_label
                FROM agg a
                LEFT JOIN rep_task rt ON rt.team_user_id = a.team_user_id
                ORDER BY a.damage DESC
                """.formatted(searchFilter);
        Query q = em.createNativeQuery(sql);
        q.setParameter("fromDate", fromDate);
        q.setParameter("toDate", toDate);
        if (searchPattern != null) {
            q.setParameter("searchPattern", searchPattern);
        }
        List<Object[]> rows = q.getResultList();

        Map<UUID, BigDecimal> prevDamage = loadDamageByUser(prev.from(), prev.to());

        List<DirectorWasteTeamRow> result = new ArrayList<>();
        for (Object[] r : rows) {
            UUID teamUserId = toUuid(r[0]);
            String fullName = r[1] != null ? r[1].toString() : null;
            String username = r[2] != null ? r[2].toString() : null;
            BigDecimal damage = toBigDecimal(r[3]);
            long events = ((Number) r[4]).longValue();
            BigDecimal boards = toBigDecimal(r[5]);
            String areaLabel = Objects.toString(r[6], "");
            WasteSeverity sev = classify(damage, events);
            if (severityFilter != null && sev != severityFilter) {
                continue;
            }
            BigDecimal prevD = prevDamage.getOrDefault(teamUserId, BigDecimal.ZERO);
            BigDecimal trend = null;
            if (prevD.compareTo(BigDecimal.ZERO) != 0) {
                trend = damage.subtract(prevD)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(prevD, 1, RoundingMode.HALF_UP);
            }
            String pic = Optional.ofNullable(fullName).filter(s -> !s.isBlank())
                    .orElseGet(() -> Objects.toString(username, "Chưa xác định"));
            String teamLabel = "Tổ — " + pic;
            result.add(DirectorWasteTeamRow.builder()
                    .rank(0)
                    .teamUserId(teamUserId)
                    .teamLabel(teamLabel)
                    .areaLabel(areaLabel.isBlank() ? null : areaLabel)
                    .picName(pic)
                    .eventCount(events)
                    .boardEquivalent(boards)
                    .estimatedDamageVnd(damage)
                    .trendPercent(trend)
                    .severity(sev)
                    .build());
        }
        return result;
    }

    private Map<UUID, BigDecimal> loadDamageByUser(LocalDate fromDate, LocalDate toDate) {
        String sql = """
                SELECT pt.assigned_to AS team_user_id,
                       SUM(ABS(il.quantity_change) * COALESCE(il.unit_price_at_time, 0)) AS damage
                FROM inventory_logs il
                INNER JOIN production_tasks pt ON pt.id = il.task_id
                WHERE il.transaction_type = 'WASTE'
                  AND pt.assigned_to IS NOT NULL
                  AND il.created_at >= CAST(:fromDate AS timestamp)
                  AND il.created_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                GROUP BY pt.assigned_to
                """;
        Query q = em.createNativeQuery(sql);
        q.setParameter("fromDate", fromDate);
        q.setParameter("toDate", toDate);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        Map<UUID, BigDecimal> map = new HashMap<>();
        for (Object[] r : rows) {
            map.put(toUuid(r[0]), toBigDecimal(r[1]));
        }
        return map;
    }

    private PeriodPair previousPeriod(LocalDate fromDate, LocalDate toDate) {
        long days = ChronoUnit.DAYS.between(fromDate, toDate) + 1;
        LocalDate prevTo = fromDate.minusDays(1);
        LocalDate prevFrom = prevTo.minusDays(days - 1);
        return new PeriodPair(prevFrom, prevTo);
    }

    private record PeriodPair(LocalDate from, LocalDate to) {}

    private WasteSeverity classify(BigDecimal damage, long events) {
        if (damage.compareTo(SEV_CRITICAL_DAMAGE) >= 0 || events >= SEV_CRITICAL_EVENTS) {
            return WasteSeverity.CRITICAL;
        }
        if (damage.compareTo(SEV_HIGH_DAMAGE) >= 0 || events >= SEV_HIGH_EVENTS) {
            return WasteSeverity.HIGH;
        }
        if (damage.compareTo(SEV_WATCH_DAMAGE) >= 0 || events >= SEV_WATCH_EVENTS) {
            return WasteSeverity.WATCH;
        }
        return WasteSeverity.OK;
    }

    @SuppressWarnings("unchecked")
    private List<DirectorWasteMaterialRow> loadMaterialBreakdown(UUID teamUserId, LocalDate from, LocalDate to) {
        String sql = """
                SELECT m.id,
                       m.code,
                       m.name,
                       SUM(ABS(il.quantity_change)) AS qty_sum,
                       SUM(ABS(il.quantity_change) * COALESCE(il.unit_price_at_time, 0)) AS damage
                FROM inventory_logs il
                INNER JOIN production_tasks pt ON pt.id = il.task_id
                INNER JOIN materials m ON m.id = il.material_id
                WHERE il.transaction_type = 'WASTE'
                  AND pt.assigned_to = :teamUserId
                  AND il.created_at >= CAST(:fromDate AS timestamp)
                  AND il.created_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                GROUP BY m.id, m.code, m.name
                ORDER BY damage DESC
                """;
        Query q = em.createNativeQuery(sql);
        q.setParameter("teamUserId", teamUserId);
        q.setParameter("fromDate", from);
        q.setParameter("toDate", to);
        List<Object[]> rows = q.getResultList();
        List<DirectorWasteMaterialRow> list = new ArrayList<>();
        for (Object[] r : rows) {
            list.add(DirectorWasteMaterialRow.builder()
                    .materialId(toUuid(r[0]))
                    .materialCode(r[1] != null ? r[1].toString() : null)
                    .materialName(r[2] != null ? r[2].toString() : null)
                    .quantityAbs(toBigDecimal(r[3]))
                    .damageVnd(toBigDecimal(r[4]))
                    .build());
        }
        return list;
    }

    private LocalDateTime loadLatestEventAt(UUID teamUserId, LocalDate from, LocalDate to) {
        String sql = """
                SELECT MAX(il.created_at)
                FROM inventory_logs il
                INNER JOIN production_tasks pt ON pt.id = il.task_id
                WHERE il.transaction_type = 'WASTE'
                  AND pt.assigned_to = :teamUserId
                  AND il.created_at >= CAST(:fromDate AS timestamp)
                  AND il.created_at < CAST(:toDate AS timestamp) + INTERVAL '1 day'
                """;
        Query q = em.createNativeQuery(sql);
        q.setParameter("teamUserId", teamUserId);
        q.setParameter("fromDate", from);
        q.setParameter("toDate", to);
        Object single = q.getSingleResult();
        if (single == null) {
            return null;
        }
        if (single instanceof LocalDateTime ldt) {
            return ldt;
        }
        if (single instanceof java.sql.Timestamp ts) {
            return ts.toLocalDateTime();
        }
        return null;
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        return new BigDecimal(value.toString());
    }

    /**
     * JDBC/Hibernate có thể trả UUID dạng {@link UUID} hoặc {@link String} tùy driver — tránh ClassCastException → 500.
     */
    private static UUID toUuid(Object value) {
        if (value == null) {
            throw new IllegalStateException("UUID null từ native query");
        }
        if (value instanceof UUID u) {
            return u;
        }
        if (value instanceof String s) {
            return UUID.fromString(s);
        }
        return UUID.fromString(value.toString());
    }
}
