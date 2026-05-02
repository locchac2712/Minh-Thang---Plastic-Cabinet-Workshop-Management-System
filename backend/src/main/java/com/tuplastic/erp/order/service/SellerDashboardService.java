package com.tuplastic.erp.order.service;

import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.order.dto.AgencyDebtRiskItem;
import com.tuplastic.erp.order.dto.OrderResponse;
import com.tuplastic.erp.order.dto.SellerDashboardResponse;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.mapper.OrderMapper;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SellerDashboardService {

    private static final int RECENT_ORDER_LIMIT = 5;
    private static final int DEBT_RISK_LIMIT = 5;

    private final OrderRepository orderRepository;
    private final AgencyRepository agencyRepository;
    private final OrderMapper orderMapper;

    public SellerDashboardResponse getDashboard(User seller, LocalDate fromDate, LocalDate toDate) {
        LocalDateTime fromTs = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime toTs = toDate == null ? null : toDate.plusDays(1).atStartOfDay();

        List<Object[]> countRows = (fromTs == null && toTs == null)
                ? orderRepository.countGroupByStatusForSeller(seller.getId())
                : orderRepository.countGroupByStatusForSellerInPeriod(seller.getId(), fromTs, toTs);

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (OrderStatus s : OrderStatus.values()) {
            byStatus.put(s.name(), 0L);
        }
        for (Object[] row : countRows) {
            OrderStatus st = (OrderStatus) row[0];
            byStatus.put(st.name(), ((Number) row[1]).longValue());
        }

        List<AgencyDebtRiskItem> risk = agencyRepository
                .findDebtRiskBySeller(seller.getId(), PageRequest.of(0, DEBT_RISK_LIMIT))
                .getContent()
                .stream()
                .map(this::toDebtRisk)
                .toList();

        Page<Order> recentPage = orderRepository.findBySellerWithFilters(
                seller.getId(), null, PageRequest.of(0, RECENT_ORDER_LIMIT));
        List<OrderResponse> recent = recentPage.getContent().stream()
                .map(orderMapper::toResponse)
                .toList();

        return SellerDashboardResponse.builder()
                .orderCountByStatus(byStatus)
                .agenciesNearingDebtLimit(risk)
                .recentOrders(recent)
                .build();
    }

    private AgencyDebtRiskItem toDebtRisk(Agency a) {
        return AgencyDebtRiskItem.builder()
                .id(a.getId())
                .name(a.getName())
                .totalDebt(a.getTotalDebt())
                .maxDebtLimit(a.getMaxDebtLimit())
                .build();
    }
}
