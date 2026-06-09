package com.tuplastic.erp.reconcile;

import com.tuplastic.erp.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Tính dư nợ đại lý từ đơn DH mở (Approved / Producing / Done, {@code source_order_id NOT NULL}).
 * Không gồm báo giá BG. Ledger {@code agencies.total_debt} vẫn chỉ cập nhật khi Done.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AgencyDebtComputationService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final OrderRepository orderRepository;

    public BigDecimal computeForAgency(UUID agencyId) {
        if (agencyId == null) {
            return ZERO;
        }
        BigDecimal sum = orderRepository.sumRemainingDebtForAgency(agencyId);
        return sum != null ? sum : ZERO;
    }

    public Map<UUID, BigDecimal> batchCompute(Collection<UUID> agencyIds) {
        if (agencyIds == null || agencyIds.isEmpty()) {
            return Map.of();
        }
        List<Object[]> rows = orderRepository.sumRemainingDebtByAgencyIds(agencyIds);
        Map<UUID, BigDecimal> out = new HashMap<>();
        for (Object[] row : rows) {
            out.put((UUID) row[0], toBigDecimal(row[1]));
        }
        return out;
    }

    public Map<UUID, BigDecimal> computeAllAgencies() {
        List<Object[]> rows = orderRepository.sumRemainingDebtAllAgencies();
        Map<UUID, BigDecimal> out = new HashMap<>();
        for (Object[] row : rows) {
            out.put((UUID) row[0], toBigDecimal(row[1]));
        }
        return out;
    }

    public BigDecimal reconciliationDelta(BigDecimal recordedDebt, BigDecimal computedDebt) {
        BigDecimal recorded = recordedDebt != null ? recordedDebt : ZERO;
        BigDecimal computed = computedDebt != null ? computedDebt : ZERO;
        return recorded.subtract(computed);
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        return new BigDecimal(value.toString());
    }
}
