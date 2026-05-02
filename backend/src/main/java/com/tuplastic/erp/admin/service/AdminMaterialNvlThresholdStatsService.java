package com.tuplastic.erp.admin.service;

import com.tuplastic.erp.admin.dto.MaterialNvlThresholdStatsResponse;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Thống kê NVL theo ngưỡng tồn so với min (3 nhóm) cho bảng điều khiển admin.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminMaterialNvlThresholdStatsService {

    /** Từ min trở lên nhưng dưới mức tối thiểu × hệ số này được xếp là "gần min" (còn lại là "an toàn" nếu tồn ≥ min × hệ số, hoặc chưa cài min = 0). */
    public static final BigDecimal DEFAULT_BUFFER_MULTIPLIER = new BigDecimal("1.2");

    private static final String STATS_SQL = """
            SELECT
             (SELECT COUNT(*)
                FROM materials m
               WHERE m.is_active = TRUE
                 AND (m.min_stock_level <= 0
                      OR m.stock_quantity >= m.min_stock_level * CAST(:buffer AS numeric))
             )::bigint AS tren,
             (SELECT COUNT(*)
                FROM materials m
               WHERE m.is_active = TRUE
                 AND m.min_stock_level > 0
                 AND m.stock_quantity >= m.min_stock_level
                 AND m.stock_quantity < m.min_stock_level * CAST(:buffer AS numeric)
             )::bigint AS gan,
             (SELECT COUNT(*)
                FROM materials m
               WHERE m.is_active = TRUE
                 AND m.min_stock_level > 0
                 AND m.stock_quantity < m.min_stock_level
             )::bigint AS duoi,
             (SELECT COUNT(*)
                FROM materials m
               WHERE m.is_active = TRUE
             )::bigint AS tong
            """;

    private final EntityManager entityManager;

    public MaterialNvlThresholdStatsResponse getStats() {
        return getStats(DEFAULT_BUFFER_MULTIPLIER);
    }

    public MaterialNvlThresholdStatsResponse getStats(BigDecimal bufferMultiplier) {
        BigDecimal buffer = bufferMultiplier != null
                && bufferMultiplier.compareTo(BigDecimal.ONE) > 0
                ? bufferMultiplier
                : DEFAULT_BUFFER_MULTIPLIER;

        Object[] row = (Object[]) entityManager.createNativeQuery(STATS_SQL)
                .setParameter("buffer", buffer)
                .getSingleResult();

        return MaterialNvlThresholdStatsResponse.builder()
                .trenNguongAnToanCount(toLong(row[0]))
                .ganNguongMinCount(toLong(row[1]))
                .duoiMinCount(toLong(row[2]))
                .tongVatTuActive(toLong(row[3]))
                .bufferMultiplier(buffer)
                .build();
    }

    private static long toLong(Object v) {
        if (v == null) {
            return 0L;
        }
        if (v instanceof Number n) {
            return n.longValue();
        }
        return 0L;
    }
}
