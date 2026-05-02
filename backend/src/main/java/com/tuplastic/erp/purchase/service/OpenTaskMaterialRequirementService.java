package com.tuplastic.erp.purchase.service;

import com.tuplastic.erp.purchase.dto.OpenTaskMaterialNeedItem;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OpenTaskMaterialRequirementService {

    private final EntityManager em;

    @SuppressWarnings("unchecked")
    public List<OpenTaskMaterialNeedItem> listOpenTaskMaterialNeeds() {
        String sql = """
                WITH need AS (
                    SELECT bi.material_id,
                           COALESCE(SUM(t.quantity::numeric * bi.quantity), 0) AS required_qty
                    FROM production_tasks t
                    JOIN bom_items bi ON bi.product_id = t.product_id
                    WHERE t.status IN ('Waiting', 'Doing')
                      AND t.product_id IS NOT NULL
                    GROUP BY bi.material_id
                )
                SELECT m.id, m.code, m.name, m.unit,
                       n.required_qty,
                       m.stock_quantity,
                       m.min_stock_level
                FROM need n
                JOIN materials m ON m.id = n.material_id
                WHERE m.is_active = TRUE
                ORDER BY m.code
                """;
        Query q = em.createNativeQuery(sql);
        List<Object[]> rows = q.getResultList();
        return rows.stream().map(this::toItem).toList();
    }

    private OpenTaskMaterialNeedItem toItem(Object[] r) {
        BigDecimal required = toBd(r[4]);
        BigDecimal stock = toBd(r[5]);
        BigDecimal min = toBd(r[6]);
        BigDecimal shortage = required.subtract(stock);
        if (shortage.compareTo(BigDecimal.ZERO) < 0) {
            shortage = BigDecimal.ZERO;
        }
        return OpenTaskMaterialNeedItem.builder()
                .materialId((UUID) r[0])
                .materialCode((String) r[1])
                .materialName((String) r[2])
                .unit((String) r[3])
                .requiredForOpenTasks(required.setScale(4, RoundingMode.HALF_UP))
                .stockQuantity(stock)
                .minStockLevel(min)
                .suggestedOrderQuantity(shortage.setScale(4, RoundingMode.HALF_UP))
                .build();
    }

    private BigDecimal toBd(Object o) {
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal b) return b;
        return new BigDecimal(o.toString());
    }
}
