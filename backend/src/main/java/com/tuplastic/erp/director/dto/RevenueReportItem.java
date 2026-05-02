package com.tuplastic.erp.director.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevenueReportItem {

    private String period;
    private Long orderCount;
    private BigDecimal totalRevenue;
}
