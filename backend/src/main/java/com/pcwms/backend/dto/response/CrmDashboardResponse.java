package com.pcwms.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class CrmDashboardResponse {
    private BigDecimal actualRevenue; // Tổng tiền thực thu (Payment PAID/SUCCESS)
    private BigDecimal newDebt;        // Tổng nợ mới phát sinh (SalesOrder total - paid)
    private long totalNewCustomers;    // Số khách hàng mới tạo trong tháng
    private long totalActiveCustomers; // Tổng khách hàng đang hoạt động hiện tại
    private long totalInactiveCustomers; // Tổng khách hàng đã ngừng hoạt động
}
