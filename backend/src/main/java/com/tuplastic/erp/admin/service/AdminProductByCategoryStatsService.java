package com.tuplastic.erp.admin.service;

import com.tuplastic.erp.admin.dto.ProductSkuByCategoryItem;
import com.tuplastic.erp.common.exception.BadRequestException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Thống kê số SKU (sản phẩm mẫu) theo danh mục — biểu đồ cột "Mẫu tủ theo ngành hàng".
 * Chỉ đếm {@code is_active = true}, {@code is_custom = false}, có {@code category_id}.
 * Lọc theo ngày tạo: {@code created_at} trong {@code [from_date, to_date]} (cận phải inclusive theo ngày).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminProductByCategoryStatsService {

    public static final int MAX_RANGE_DAYS = 366;

    private static final String SQL_ALL_TIME = """
            SELECT c.id AS category_id,
                   c.name AS category_name,
                   COUNT(p.id)::bigint AS sku_count
            FROM categories c
            INNER JOIN products p ON p.category_id = c.id
              AND p.is_active = TRUE
              AND p.is_custom = FALSE
            WHERE c.is_active = TRUE
            GROUP BY c.id, c.name
            ORDER BY sku_count DESC, c.name ASC
            """;

    private static final String SQL_IN_RANGE = """
            SELECT c.id AS category_id,
                   c.name AS category_name,
                   COUNT(p.id)::bigint AS sku_count
            FROM categories c
            INNER JOIN products p ON p.category_id = c.id
              AND p.is_active = TRUE
              AND p.is_custom = FALSE
              AND p.created_at >= CAST(:fromDate AS timestamp)
              AND p.created_at < CAST(:toDate AS date) + INTERVAL '1 day'
            WHERE c.is_active = TRUE
            GROUP BY c.id, c.name
            ORDER BY sku_count DESC, c.name ASC
            """;

    private final EntityManager entityManager;

    /**
     * @param fromDate optional; nếu chỉ truyền {@code toDate} thì {@code from} = {@code toDate} − 365 ngày (tối đa)
     * @param toDate optional; nếu chỉ truyền {@code fromDate} thì {@code to} = hôm nay
     */
    public List<ProductSkuByCategoryItem> listByCategory(LocalDate fromDate, LocalDate toDate) {
        if (fromDate == null && toDate == null) {
            return mapRows(entityManager.createNativeQuery(SQL_ALL_TIME).getResultList());
        }

        LocalDate from = fromDate;
        LocalDate to = toDate != null ? toDate : LocalDate.now();
        if (from == null) {
            from = to.minusDays((long) MAX_RANGE_DAYS - 1);
        }
        if (from.isAfter(to)) {
            throw new BadRequestException("Tham số from_date không được sau to_date.");
        }
        if (ChronoUnit.DAYS.between(from, to) + 1 > MAX_RANGE_DAYS) {
            throw new BadRequestException("Khoảng ngày tối đa là " + MAX_RANGE_DAYS + " (tính cả 2 cận).");
        }

        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(SQL_IN_RANGE)
                .setParameter("fromDate", from)
                .setParameter("toDate", to)
                .getResultList();
        return mapRows(rows);
    }

    @SuppressWarnings("unchecked")
    private List<ProductSkuByCategoryItem> mapRows(List<?> raw) {
        List<Object[]> rows = (List<Object[]>) raw;
        List<ProductSkuByCategoryItem> out = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            UUID catId = row[0] instanceof UUID u ? u : UUID.fromString(row[0].toString());
            String name = row[1] != null ? row[1].toString() : "";
            long n = row[2] instanceof Number num ? num.longValue() : 0L;
            out.add(ProductSkuByCategoryItem.builder()
                    .categoryId(catId)
                    .categoryName(name)
                    .skuCount(n)
                    .build());
        }
        return out;
    }
}
