package com.tuplastic.erp.production.dto.chart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Stacked-series-friendly: top materials cố định + cột {@code others} cho các vật tư còn lại.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialConsumptionTrend {

    private List<TopMaterial> topMaterials;
    private List<MaterialConsumptionPoint> series;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopMaterial {
        private String materialCode;
        private String materialName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaterialConsumptionPoint {
        private LocalDate bucket;
        /** key = materialCode hoặc {@code "others"}; value = damage VND. */
        private java.util.Map<String, BigDecimal> values;
    }
}
