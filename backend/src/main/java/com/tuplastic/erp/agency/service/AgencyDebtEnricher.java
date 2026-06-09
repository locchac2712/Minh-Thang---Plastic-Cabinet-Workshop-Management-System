package com.tuplastic.erp.agency.service;

import com.tuplastic.erp.agency.dto.AgencyResponse;
import com.tuplastic.erp.reconcile.AgencyDebtComputationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AgencyDebtEnricher {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final AgencyDebtComputationService agencyDebtComputationService;

    public AgencyResponse enrich(AgencyResponse response) {
        if (response == null || response.getId() == null) {
            return response;
        }
        BigDecimal computed = agencyDebtComputationService.computeForAgency(response.getId());
        return applyComputed(response, computed);
    }

    public List<AgencyResponse> enrichAll(List<AgencyResponse> responses) {
        if (responses == null || responses.isEmpty()) {
            return responses;
        }
        List<UUID> ids = responses.stream()
                .map(AgencyResponse::getId)
                .filter(Objects::nonNull)
                .toList();
        Map<UUID, BigDecimal> batch = agencyDebtComputationService.batchCompute(ids);
        return responses.stream()
                .map(r -> applyComputed(r, batch.getOrDefault(r.getId(), ZERO)))
                .toList();
    }

    private AgencyResponse applyComputed(AgencyResponse response, BigDecimal computed) {
        BigDecimal recorded = response.getTotalDebt() != null ? response.getTotalDebt() : ZERO;
        BigDecimal safeComputed = computed != null ? computed : ZERO;
        response.setComputedDebtFromOrders(safeComputed);
        response.setDebtReconciliationDelta(
                agencyDebtComputationService.reconciliationDelta(recorded, safeComputed));
        return response;
    }
}
