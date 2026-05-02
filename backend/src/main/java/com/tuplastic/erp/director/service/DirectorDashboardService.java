package com.tuplastic.erp.director.service;

import com.tuplastic.erp.director.dto.DirectorDashboardResponse;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.reconcile.DebtReconciliationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DirectorDashboardService {

    private final ReportService reportService;
    private final OrderRepository orderRepository;
    private final DebtReconciliationService debtReconciliationService;

    public DirectorDashboardResponse getDashboard(LocalDate fromDate, LocalDate toDate) {
        return DirectorDashboardResponse.builder()
                .revenueByPeriod(reportService.getRevenueReport(fromDate, toDate))
                .grossMargin(reportService.getGrossMarginReport(fromDate, toDate))
                .pendingOrderCount(orderRepository.countByStatus(OrderStatus.Pending))
                .debtSanity(debtReconciliationService.snapshotNegativeDebts())
                .build();
    }
}
