package com.tuplastic.erp.director.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiscountReportItem {

    private UUID sellerId;
    private String sellerName;
    private Long orderCount;
    private BigDecimal totalDiscount;
}
