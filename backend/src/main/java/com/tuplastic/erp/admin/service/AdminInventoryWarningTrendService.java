package com.tuplastic.erp.admin.service;

import com.tuplastic.erp.admin.dto.InventoryWarningTrendPoint;
import com.tuplastic.erp.common.exception.BadRequestException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Xu hướng số NVL “cảnh báo tồn” theo ngày, phục vụ chart area (admin).
 * <p>
 * Tồn ước tính cuối ngày D: lấy {@code materials.stock_quantity} (hiện tại) trừ
 * tổng {@code inventory_logs.quantity_change} của mọi ghi nhận có
 * {@code date(created_at) > D} (tức từ 0:00 ngày D+1 tới nay), tương đương
 * tồn tại thời điểm cuối D nếu mọi thay đổi tồn đều có trong bảng log. Mức tối thiểu
 * dùng cột {@code min_stock_level} <strong>hiện tại</strong> (không lưu lịch sử
 * từng thay đổi min theo thời gian).
 * </p>
 * Chỉ tính vật tư active có {@code min_stock_level &gt; 0}. Cảnh báo khi
 * tồn ước tính &le; mức tối thiểu (giống logic “dưới/đúng hạn mức tối thiểu”).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminInventoryWarningTrendService {

    public static final int MAX_RANGE_DAYS = 366;
    public static final int DEFAULT_LAST_DAYS = 7;

    private static final String TREND_SQL = """
            SELECT
              (gs.d::date) AS day_val,
              (
                SELECT COUNT(*)::bigint
                FROM materials m
                WHERE m.is_active = TRUE
                  AND m.min_stock_level > 0
                  AND (
                    m.stock_quantity
                    - COALESCE((
                      SELECT SUM(il.quantity_change)
                      FROM inventory_logs il
                      WHERE il.material_id = m.id
                        AND (il.created_at::date) > (gs.d::date)
                    ), 0)
                  ) <= m.min_stock_level
              ) AS warning_cnt
            FROM generate_series(
              CAST(:fromDate AS date),
              CAST(:toDate AS date),
              INTERVAL '1 day'
            ) AS gs(d)
            ORDER BY gs.d
            """;

    private final EntityManager entityManager;

    /**
     * @param fromDate inclusive; nếu null, mặc định {@code toDate} trừ {@value #DEFAULT_LAST_DAYS} + 1 ngày
     * @param toDate inclusive; nếu null, mặc định hôm nay (múi hệ thống)
     */
    public List<InventoryWarningTrendPoint> getTrend(LocalDate fromDate, LocalDate toDate) {
        LocalDate toD = toDate != null ? toDate : LocalDate.now();
        LocalDate fromD = fromDate != null
                ? fromDate
                : toD.minusDays((long) DEFAULT_LAST_DAYS - 1);
        if (fromD.isAfter(toD)) {
            throw new BadRequestException("Tham số from_date không được sau to_date.");
        }
        if (ChronoUnit.DAYS.between(fromD, toD) + 1 > MAX_RANGE_DAYS) {
            throw new BadRequestException("Khoảng ngày tối đa là " + MAX_RANGE_DAYS + " (tính cả 2 cận).");
        }

        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(TREND_SQL)
                .setParameter("fromDate", fromD)
                .setParameter("toDate", toD)
                .getResultList();

        List<InventoryWarningTrendPoint> out = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Object dayObj = row[0];
            LocalDate d;
            if (dayObj instanceof Date sqlDate) {
                d = sqlDate.toLocalDate();
            } else if (dayObj instanceof java.sql.Timestamp ts) {
                d = ts.toLocalDateTime().toLocalDate();
            } else if (dayObj instanceof java.time.Instant inst) {
                d = inst.atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            } else if (dayObj instanceof LocalDate ld) {
                d = ld;
            } else if (dayObj == null) {
                continue;
            } else {
                d = LocalDate.parse(dayObj.toString().substring(0, 10));
            }
            long n = 0L;
            if (row[1] instanceof Number num) {
                n = num.longValue();
            }
            out.add(InventoryWarningTrendPoint.builder()
                    .date(d)
                    .warningSkuCount(n)
                    .build());
        }
        return out;
    }
}
