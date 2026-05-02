package com.tuplastic.erp.director.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceivableWarningsSummaryDto {

    /** Ngày dùng tính quá hạn (“hôm nay”). */
    private LocalDate summaryDate;

    /** Số ngày ân hạn áp sau anchor (backend config). */
    private int dueGraceDaysApplied;

    /** Số đại lý trong cohort Top-N (hoặc sau filter risk). */
    private int cohortAgencyCount;

    private int topLimitUsed;

    /** Tổng công nợ ghi sổ cohort: SUM(agencies.total_debt). */
    private BigDecimal totalReceivableRecorded;

    /** Ước tính phần quá hạn từ các đơn Done còn dư thu (có thể nhỏ hơn totalDebt nếu nợ không gắn đơn). */
    private BigDecimal estimatedOverdueFromOrders;

    /** Số đại lý SERIOUS trong cohort. */
    private long urgentAgencyCount;

    private List<ReceivableRiskCountDto> riskCounts;

    /** Trung bình max ngày trễ theo đại lý trong cohort (đại lý không có đơn quá hạn tính 0). */
    private BigDecimal averageAgencyMaxOverdueDays;

    /** Max ngày trễ lớn nhất trong cohort. */
    private int cohortMaxOverdueDays;
}
