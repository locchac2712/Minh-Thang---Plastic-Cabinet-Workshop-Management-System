package com.tuplastic.erp.production.service;

import com.tuplastic.erp.material.repository.MaterialRepository;
import com.tuplastic.erp.production.dto.ProductionDashboardResponse;
import com.tuplastic.erp.production.dto.ShopFloorKpiSummary;
import com.tuplastic.erp.production.dto.TaskResponse;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductionDashboardService {

    private static final int MY_OPEN_TASKS_LIMIT = 5;

    private final ProductionTaskService productionTaskService;
    private final MaterialRepository materialRepository;
    private final ShopFloorPerformanceService shopFloorPerformanceService;

    public ProductionDashboardResponse getDashboard(User currentUser) {
        List<TaskResponse> mine = productionTaskService.getMyOpenTasks(currentUser, MY_OPEN_TASKS_LIMIT);
        ShopFloorKpiSummary kpi30 = shopFloorPerformanceService.getKpiLast30Days(LocalDate.now());
        return ProductionDashboardResponse.builder()
                .taskCountByStatus(productionTaskService.getTaskCountByStatus())
                .lowStockMaterialCount(materialRepository.countLowStockActive())
                .myOpenTasks(mine)
                .shopFloorKpiLast30Days(kpi30)
                .build();
    }
}
