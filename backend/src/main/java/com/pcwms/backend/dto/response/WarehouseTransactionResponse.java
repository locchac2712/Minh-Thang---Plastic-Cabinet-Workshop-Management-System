package com.pcwms.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WarehouseTransactionResponse {
    private Long id;
    private String type; // VD: "EXPORT"
    private String referenceId; // Mã chứng từ (Mã đơn hàng/Lệnh sx)
    private LocalDateTime date;
    private String staffName; // Tên ông thủ kho xuất hàng
    private List<TransactionDetailResponse> details; // Danh sách hàng xuất
}