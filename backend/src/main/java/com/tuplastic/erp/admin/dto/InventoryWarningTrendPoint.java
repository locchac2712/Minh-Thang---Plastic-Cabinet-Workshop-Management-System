package com.tuplastic.erp.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Một điểm trên biểu đồ xu hướng cảnh báo tồn: số mã vật tư (SKU NVL) đang chạm / dưới
 * mức tối thiểu theo ước tính tồn cuối ngày (xem tài liệu API / service).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryWarningTrendPoint {

    private LocalDate date;
    private long warningSkuCount;
}
