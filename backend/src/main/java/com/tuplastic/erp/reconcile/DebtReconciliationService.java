package com.tuplastic.erp.reconcile;

import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.supplier.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Đối soát nhẹ: phát hiện công nợ lưu trữ âm (lỗ dữ liệu / race). Mở rộng sau có thể so sánh với ledger.
 */
@Service
@RequiredArgsConstructor
public class DebtReconciliationService {

    private final AgencyRepository agencyRepository;
    private final SupplierRepository supplierRepository;

    @Transactional(readOnly = true)
    public DebtSanitySnapshot snapshotNegativeDebts() {
        long negAgencies = agencyRepository.findAll().stream()
                .filter(a -> a.getTotalDebt().compareTo(BigDecimal.ZERO) < 0)
                .count();
        long negSuppliers = supplierRepository.findAll().stream()
                .filter(s -> s.getTotalDebt().compareTo(BigDecimal.ZERO) < 0)
                .count();
        return new DebtSanitySnapshot(negAgencies, negSuppliers);
    }

    public record DebtSanitySnapshot(long agenciesWithNegativeDebt, long suppliersWithNegativeDebt) {}
}
