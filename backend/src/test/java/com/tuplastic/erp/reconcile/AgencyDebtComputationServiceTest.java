package com.tuplastic.erp.reconcile;

import com.tuplastic.erp.order.repository.OrderRepository;
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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AgencyDebtComputationServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private AgencyDebtComputationService service;

    @Test
    void computeForAgency_returnsZeroWhenRepositoryReturnsNull() {
        UUID agencyId = UUID.randomUUID();
        when(orderRepository.sumRemainingDebtForAgency(agencyId)).thenReturn(null);

        assertEquals(BigDecimal.ZERO, service.computeForAgency(agencyId));
    }

    @Test
    void computeForAgency_returnsSumFromRepository() {
        UUID agencyId = UUID.randomUUID();
        when(orderRepository.sumRemainingDebtForAgency(agencyId)).thenReturn(new BigDecimal("15000000"));

        assertEquals(new BigDecimal("15000000"), service.computeForAgency(agencyId));
    }

    @Test
    void batchCompute_emptyCollection_skipsQuery() {
        assertTrue(service.batchCompute(List.of()).isEmpty());
        verifyNoInteractions(orderRepository);
    }

    @Test
    void batchCompute_mapsAgencyRows() {
        UUID a1 = UUID.randomUUID();
        UUID a2 = UUID.randomUUID();
        when(orderRepository.sumRemainingDebtByAgencyIds(any()))
                .thenReturn(List.of(
                        new Object[]{a1, new BigDecimal("1000")},
                        new Object[]{a2, new BigDecimal("2500")}));

        Map<UUID, BigDecimal> result = service.batchCompute(List.of(a1, a2));

        assertEquals(new BigDecimal("1000"), result.get(a1));
        assertEquals(new BigDecimal("2500"), result.get(a2));
    }

    @Test
    void reconciliationDelta_subtractsComputedFromRecorded() {
        assertEquals(new BigDecimal("500"),
                service.reconciliationDelta(new BigDecimal("1500"), new BigDecimal("1000")));
        assertEquals(BigDecimal.ZERO, service.reconciliationDelta(null, null));
    }
}
