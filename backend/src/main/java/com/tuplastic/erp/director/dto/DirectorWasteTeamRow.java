package com.tuplastic.erp.director.dto;

import com.tuplastic.erp.director.enums.WasteSeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectorWasteTeamRow {

    private int rank;
    private UUID teamUserId;
    /** MVP: nhãn hiển thị (vd "Tổ — Họ tên") */
    private String teamLabel;
    /** Gợi ý từ sản phẩm của task có thiệt hại lớn nhất trong kỳ */
    private String areaLabel;
    private String picName;
    private long eventCount;
    private BigDecimal boardEquivalent;
    private BigDecimal estimatedDamageVnd;
    /** null nếu kỳ trước không có thiệt hại để so sánh */
    private BigDecimal trendPercent;
    private WasteSeverity severity;
}
