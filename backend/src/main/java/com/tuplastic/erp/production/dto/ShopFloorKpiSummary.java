package com.tuplastic.erp.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * KPI hoàn thành lệnh: chỉ tính task {@code status = Done} có
 * {@code completed_at} nằm trong kỳ. On-time: có {@code expected_end_date}
 * và {@code completed_at}::date &le; expected_end_date.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopFloorKpiSummary {

    private long doneCompletedInPeriod;
    /** Số lệnh Done (trong kỳ) có ngày hẹn (expected) để tính on-time. */
    private long doneWithExpectedDate;
    private long onTimeCount;
    private long lateCount;
    /** Số lệnh Done thiếu expected_end_date (không dùng mẫu số tỷ lệ đúng hạn). */
    private long doneWithoutExpectedCount;
    /** 100 * onTimeCount / doneWithExpectedDate, hoặc 0 nếu mẫu số 0. */
    private BigDecimal onTimePercent;
    /** Trung bình ngày trễ (chỉ các lệnh trễ, có hẹn). */
    private BigDecimal averageDelayDaysLate;
}
