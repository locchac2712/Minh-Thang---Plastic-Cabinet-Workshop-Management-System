package com.tuplastic.erp.agency.service;

import com.tuplastic.erp.agency.dto.AgencyResponse;
import com.tuplastic.erp.reconcile.AgencyDebtComputationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AgencyDebtEnricherTest {

    @Mock
    private AgencyDebtComputationService agencyDebtComputationService;

    @InjectMocks
    private AgencyDebtEnricher agencyDebtEnricher;

    @Test
    void enrichAll_batchComputesAndSetsDelta() {
        UUID id = UUID.randomUUID();
        AgencyResponse base = AgencyResponse.builder()
                .id(id)
                .name("A")
                .totalDebt(new BigDecimal("1000"))
                .build();

        when(agencyDebtComputationService.batchCompute(any()))
                .thenReturn(Map.of(id, new BigDecimal("800")));
        when(agencyDebtComputationService.reconciliationDelta(new BigDecimal("1000"), new BigDecimal("800")))
                .thenReturn(new BigDecimal("200"));

        List<AgencyResponse> out = agencyDebtEnricher.enrichAll(List.of(base));

        assertEquals(new BigDecimal("800"), out.get(0).getComputedDebtFromOrders());
        assertEquals(new BigDecimal("200"), out.get(0).getDebtReconciliationDelta());
    }
}
