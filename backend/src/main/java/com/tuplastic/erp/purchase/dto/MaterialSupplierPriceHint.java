package com.tuplastic.erp.purchase.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Cặp vật tư – NCC (bảng material_supplier) kèm giá mua gần nhất, so với
 * unit_cost tham chiếu trên {@code materials}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialSupplierPriceHint {

    private UUID materialId;
    private String materialCode;
    private String materialName;
    private String unit;
    private BigDecimal referenceUnitCost;
    private UUID supplierId;
    private String supplierName;
    private BigDecimal lastPurchaseUnitPrice;
    private LocalDateTime lastPurchaseAt;
    private BigDecimal varianceToReference;
    private BigDecimal varianceToReferencePercent;
    private boolean hasPurchaseHistory;
}
