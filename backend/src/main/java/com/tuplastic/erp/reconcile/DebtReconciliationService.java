package com.tuplastic.erp.reconcile;

import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.supplier.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Đối soát nhẹ: phát hiện công nợ lưu trữ âm (lỗ dữ liệu / race) và lệch ledger vs đơn Done.
 */
@Service
@RequiredArgsConstructor
public class DebtReconciliationService {

    private static final BigDecimal MISMATCH_EPSILON = BigDecimal.ONE;

    private final AgencyRepository agencyRepository;
    private final SupplierRepository supplierRepository;
    private final AgencyDebtComputationService agencyDebtComputationService;

    @Transactional(readOnly = true)
    public DebtSanitySnapshot snapshotNegativeDebts() {
        long negAgencies = agencyRepository.findAll().stream()
                .filter(a -> a.getTotalDebt().compareTo(BigDecimal.ZERO) < 0)
                .count();
        long negSuppliers = supplierRepository.findAll().stream()
                .filter(s -> s.getTotalDebt().compareTo(BigDecimal.ZERO) < 0)
                .count();

        Map<UUID, BigDecimal> computedByAgency = agencyDebtComputationService.computeAllAgencies();
        List<DebtMismatchItem> mismatches = new ArrayList<>();
        for (Agency agency : agencyRepository.findAll()) {
            BigDecimal recorded = agency.getTotalDebt() != null ? agency.getTotalDebt() : BigDecimal.ZERO;
            BigDecimal computed = computedByAgency.getOrDefault(agency.getId(), BigDecimal.ZERO);
            BigDecimal delta = agencyDebtComputationService.reconciliationDelta(recorded, computed);
            if (delta.abs().compareTo(MISMATCH_EPSILON) > 0) {
                mismatches.add(new DebtMismatchItem(
                        agency.getId(),
                        agency.getName(),
                        recorded,
                        computed,
                        delta));
            }
        }
        mismatches.sort(Comparator.comparing((DebtMismatchItem m) -> m.debtReconciliationDelta().abs()).reversed());

        int topLimit = Math.min(10, mismatches.size());
        List<DebtMismatchItem> top = topLimit == 0 ? List.of() : mismatches.subList(0, topLimit);

        return new DebtSanitySnapshot(negAgencies, negSuppliers, mismatches.size(), top);
    }

    public record DebtSanitySnapshot(
            long agenciesWithNegativeDebt,
            long suppliersWithNegativeDebt,
            long agenciesWithDebtMismatch,
            List<DebtMismatchItem> topDebtMismatches) {}

    public record DebtMismatchItem(
            UUID agencyId,
            String agencyName,
            BigDecimal totalDebtRecorded,
            BigDecimal computedDebtFromOrders,
            BigDecimal debtReconciliationDelta) {}
}
