package com.tuplastic.erp.admin.service;

import com.tuplastic.erp.admin.dto.ProductBomStatusByProductStatsResponse;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Đọc số lượng sản phẩm theo trạng thái BOM/đủ tồn, phục vụ biểu đồ bảng điều khiển admin.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminProductBomByProductStatsService {

    private static final String STATS_SQL = """
            SELECT
             (SELECT COUNT(*)
                FROM products p
               WHERE p.is_active = TRUE
                 AND p.is_custom = FALSE
                 AND NOT EXISTS (SELECT 1 FROM bom_items bi WHERE bi.product_id = p.id)
             )::bigint AS chua_cau,
             (SELECT COUNT(*)
                FROM products p
               WHERE p.is_active = TRUE
                 AND p.is_custom = FALSE
                 AND EXISTS (SELECT 1 FROM bom_items bi WHERE bi.product_id = p.id)
                 AND EXISTS (
                    SELECT 1
                      FROM bom_items bi
                      JOIN materials m ON m.id = bi.material_id
                     WHERE bi.product_id = p.id
                       AND (m.is_active = FALSE OR m.stock_quantity < bi.quantity)
                 )
             )::bigint AS thieu,
             (SELECT COUNT(*)
                FROM products p
               WHERE p.is_active = TRUE
                 AND p.is_custom = FALSE
                 AND EXISTS (SELECT 1 FROM bom_items bi WHERE bi.product_id = p.id)
                 AND NOT EXISTS (
                    SELECT 1
                      FROM bom_items bi
                      JOIN materials m ON m.id = bi.material_id
                     WHERE bi.product_id = p.id
                       AND (m.is_active = FALSE OR m.stock_quantity < bi.quantity)
                 )
             )::bigint AS du,
             (SELECT COUNT(*) FROM products p
               WHERE p.is_active = TRUE AND p.is_custom = FALSE
             )::bigint AS tong
            """;

    private final EntityManager entityManager;

    public ProductBomStatusByProductStatsResponse getStats() {
        Object[] row = (Object[]) entityManager.createNativeQuery(STATS_SQL)
                .getSingleResult();

        long chua = toLong(row[0]);
        long thieu = toLong(row[1]);
        long du = toLong(row[2]);
        long tong = toLong(row[3]);

        return ProductBomStatusByProductStatsResponse.builder()
                .chuaCauHinhBomCount(chua)
                .thieuNvlTrongBomCount(thieu)
                .duDinhMucCount(du)
                .tongSoSanPham(tong)
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
