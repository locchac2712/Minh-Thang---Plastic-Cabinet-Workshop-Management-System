package com.tuplastic.erp.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Thống kê vật tư theo ngưỡng tồn (chart 3 cấp) — chỉ vật tư {@code is_active = true}.
 * <p>
 * Do bảng {@code materials} chỉ có {@code min_stock_level} (không có cột "ngưỡng an toàn" riêng),
 * dùng một hệ số đệm trên mức tối thiểu: "an toàn" nghĩa là tồn đạt từ {@code min * bufferMultiplier} trở lên
 * (mặc định 1,2; xem field {@link #bufferMultiplier}).
 * </p>
 * <ul>
 *   <li>{@link #duoiMinCount} — tồn bé hơn min: {@code min_stock_level > 0} và {@code stock_quantity &lt; min_stock_level}.</li>
 *   <li>{@link #ganNguongMinCount} — gần min: đủ tối thiểu nhưng dưới mức "đệm" trên: {@code stock_quantity &ge; min}
 *   và {@code stock_quantity &lt; min * bufferMultiplier} (khi min &gt; 0).</li>
 *   <li>{@link #trenNguongAnToanCount} — trên ngưỡng an toàn: min = 0 (chưa cài min) hoặc
 *   tồn &ge; {@code min * bufferMultiplier}.</li>
 * </ul>
 * Tổng 3 cấp bằng {@link #tongVatTuActive} (số mã NVL active).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialNvlThresholdStatsResponse {

    private long trenNguongAnToanCount;
    private long ganNguongMinCount;
    private long duoiMinCount;
    private long tongVatTuActive;
    /**
     * Hệ số so với {@code min_stock_level} dùng để tính cận dưới mức tồn "an toàn" (1,2 = trên 20% so với mức tối thiểu).
     */
    private BigDecimal bufferMultiplier;
}
