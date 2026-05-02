package com.tuplastic.erp.purchase.service;

import com.tuplastic.erp.purchase.dto.MaterialSupplierPriceHint;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MaterialSupplierPriceInsightService {

    private final EntityManager em;

    /**
     * Cặp vật tư – NCC (material_supplier) kèm giá mua mới nhất; so sánh
     * với {@code materials.unit_cost}. Lọc một vật tư (optional).
     */
    @SuppressWarnings("unchecked")
    public List<MaterialSupplierPriceHint> listMaterialSupplierPriceHints(UUID materialId) {
        String sqlAll = """
                WITH last_line AS (
                    SELECT DISTINCT ON (poi.material_id, po.supplier_id)
                        poi.material_id, po.supplier_id,
                        poi.unit_price, poi.created_at
                    FROM purchase_order_items poi
                    JOIN purchase_orders po ON po.id = poi.purchase_order_id
                    ORDER BY poi.material_id, po.supplier_id, poi.created_at DESC NULLS LAST, poi.id DESC
                )
                SELECT m.id, m.code, m.name, m.unit, m.unit_cost,
                       s.id, s.name,
                       l.unit_price, l.created_at
                FROM material_supplier ms
                JOIN materials m ON m.id = ms.material_id
                JOIN suppliers s ON s.id = ms.supplier_id
                LEFT JOIN last_line l ON l.material_id = m.id AND l.supplier_id = s.id
                WHERE m.is_active = TRUE
                ORDER BY m.code, s.name
                """;
        String sqlOne = """
                WITH last_line AS (
                    SELECT DISTINCT ON (poi.material_id, po.supplier_id)
                        poi.material_id, po.supplier_id,
                        poi.unit_price, poi.created_at
                    FROM purchase_order_items poi
                    JOIN purchase_orders po ON po.id = poi.purchase_order_id
                    WHERE poi.material_id = :mid
                    ORDER BY poi.material_id, po.supplier_id, poi.created_at DESC NULLS LAST, poi.id DESC
                )
                SELECT m.id, m.code, m.name, m.unit, m.unit_cost,
                       s.id, s.name,
                       l.unit_price, l.created_at
                FROM material_supplier ms
                JOIN materials m ON m.id = ms.material_id
                JOIN suppliers s ON s.id = ms.supplier_id
                LEFT JOIN last_line l ON l.material_id = m.id AND l.supplier_id = s.id
                WHERE m.is_active = TRUE AND m.id = :mid
                ORDER BY m.code, s.name
                """;
        Query q = em.createNativeQuery(materialId == null ? sqlAll : sqlOne);
        if (materialId != null) {
            q.setParameter("mid", materialId);
        }
        return q.getResultList().stream()
                .map(r -> toHint((Object[]) r))
                .toList();
    }

    private MaterialSupplierPriceHint toHint(Object[] r) {
        BigDecimal ref = toBd(r[4]);
        BigDecimal last = r[7] != null ? toBd(r[7]) : null;
        boolean has = last != null;
        BigDecimal var = has ? last.subtract(ref) : null;
        BigDecimal varPct;
        if (!has) {
            varPct = null;
        } else if (ref.compareTo(BigDecimal.ZERO) == 0) {
            varPct = last.compareTo(BigDecimal.ZERO) == 0
                    ? BigDecimal.ZERO
                    : null;
        } else {
            varPct = var.multiply(BigDecimal.valueOf(100))
                    .divide(ref, 2, RoundingMode.HALF_UP);
        }
        LocalDateTime at = null;
        if (r[8] != null) {
            if (r[8] instanceof Timestamp t) {
                at = t.toLocalDateTime();
            }
        }
        return MaterialSupplierPriceHint.builder()
                .materialId((UUID) r[0])
                .materialCode((String) r[1])
                .materialName((String) r[2])
                .unit((String) r[3])
                .referenceUnitCost(ref)
                .supplierId((UUID) r[5])
                .supplierName((String) r[6])
                .lastPurchaseUnitPrice(last)
                .lastPurchaseAt(at)
                .varianceToReference(var)
                .varianceToReferencePercent(varPct)
                .hasPurchaseHistory(has)
                .build();
    }

    private BigDecimal toBd(Object o) {
        if (o == null) {
            return BigDecimal.ZERO;
        }
        if (o instanceof BigDecimal b) {
            return b;
        }
        return new BigDecimal(o.toString());
    }
}
