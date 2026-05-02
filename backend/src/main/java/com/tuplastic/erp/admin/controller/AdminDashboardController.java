package com.tuplastic.erp.admin.controller;

import com.tuplastic.erp.admin.dto.AdminDashboardResponse;
import com.tuplastic.erp.admin.dto.InventoryWarningTrendPoint;
import com.tuplastic.erp.admin.dto.MaterialNvlThresholdStatsResponse;
import com.tuplastic.erp.admin.dto.ProductBomStatusByProductStatsResponse;
import com.tuplastic.erp.admin.dto.ProductSkuByCategoryItem;
import com.tuplastic.erp.admin.dto.UserCountByRoleStatsResponse;
import com.tuplastic.erp.admin.service.AdminDashboardService;
import com.tuplastic.erp.admin.service.AdminInventoryWarningTrendService;
import com.tuplastic.erp.admin.service.AdminMaterialNvlThresholdStatsService;
import com.tuplastic.erp.admin.service.AdminProductByCategoryStatsService;
import com.tuplastic.erp.admin.service.AdminProductBomByProductStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;
    private final AdminProductBomByProductStatsService productBomByProductStatsService;
    private final AdminMaterialNvlThresholdStatsService materialNvlThresholdStatsService;
    private final AdminInventoryWarningTrendService adminInventoryWarningTrendService;
    private final AdminProductByCategoryStatsService adminProductByCategoryStatsService;

    @GetMapping("/dashboard")
    public AdminDashboardResponse getDashboard() {
        return adminDashboardService.getDashboard();
    }

    /** Thống kê trạng thái BOM theo sản phẩm (biểu đồ donut). */
    @GetMapping("/dashboard/bom-by-product-stats")
    public ProductBomStatusByProductStatsResponse getBomByProductStats() {
        return productBomByProductStatsService.getStats();
    }

    /** Thống kê NVL theo ngưỡng tồn / min (biểu đồ 3 cấp). */
    @GetMapping("/dashboard/material-threshold-stats")
    public MaterialNvlThresholdStatsResponse getMaterialThresholdStats() {
        return materialNvlThresholdStatsService.getStats();
    }

    /** Số lượng user theo từng role (chỉ tài khoản đang bật). */
    @GetMapping("/dashboard/users-by-role-stats")
    public UserCountByRoleStatsResponse getUsersByRoleStats() {
        return adminDashboardService.getUserCountByRoleStats();
    }

    /**
     * Xu hướng cảnh báo tồn theo ngày (số mã NVL ước tính chạm / dưới min tại cuối mỗi ngày).
     * Query: {@code from_date}, {@code to_date} (ISO, optional — mặc định 7 ngày tới hôm nay).
     */
    @GetMapping("/dashboard/inventory-warning-trend")
    public List<InventoryWarningTrendPoint> getInventoryWarningTrend(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return adminInventoryWarningTrendService.getTrend(fromDate, toDate);
    }

    /**
     * Mẫu tủ / SKU theo ngành hàng (biểu đồ cột). Query: {@code from_date}, {@code to_date} (optional —
     * bỏ cả hai = toàn thời gian; có một trong hai = bổ sung cận còn lại như tài liệu API).
     */
    @GetMapping("/dashboard/products-by-category-stats")
    public List<ProductSkuByCategoryItem> getProductsByCategoryStats(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return adminProductByCategoryStatsService.listByCategory(fromDate, toDate);
    }
}
