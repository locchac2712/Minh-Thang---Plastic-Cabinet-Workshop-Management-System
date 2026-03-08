package com.pcwms.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransactionDetailResponse {
    private Long id;
    private String itemName; // Tên hàng (Sẽ tự lấy tên Gỗ Sồi hoặc Bàn làm việc)
    private String itemType; // Phân loại: "MATERIAL" hoặc "PRODUCT"
    private Integer quantity; // Số lượng xuất
}