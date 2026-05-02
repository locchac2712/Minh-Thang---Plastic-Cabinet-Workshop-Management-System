package com.tuplastic.erp.common.dto.chart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Một điểm dữ liệu trên trục thời gian (mặc định 1 series). FE vẽ Line/Area/Bar đơn series.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BucketPoint {
    private LocalDate bucket;
    private BigDecimal value;
    /** Số lượng entity (count) — null nếu không cần. */
    private Long count;
}
