package com.tuplastic.erp.admin.service;

import com.tuplastic.erp.admin.dto.AdminDashboardResponse;
import com.tuplastic.erp.admin.dto.RecentAgencyItem;
import com.tuplastic.erp.admin.dto.UserCountByRoleStatsResponse;
import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.material.repository.MaterialRepository;
import com.tuplastic.erp.product.repository.ProductRepository;
import com.tuplastic.erp.supplier.repository.SupplierRepository;
import com.tuplastic.erp.user.enums.UserRole;
import com.tuplastic.erp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final AgencyRepository agencyRepository;
    private final ProductRepository productRepository;
    private final MaterialRepository materialRepository;
    private final SupplierRepository supplierRepository;

    /**
     * Phân bổ nhân sự theo vai trò (chỉ user active), dùng cho biểu đồ / API tách.
     */
    public UserCountByRoleStatsResponse getUserCountByRoleStats() {
        Map<String, Long> byRole = new LinkedHashMap<>();
        long total = 0;
        for (UserRole r : UserRole.values()) {
            long c = userRepository.countByRoleAndIsActiveTrue(r);
            byRole.put(r.name(), c);
            total += c;
        }
        return UserCountByRoleStatsResponse.builder()
                .countByRole(byRole)
                .totalActiveUsers(total)
                .build();
    }

    public AdminDashboardResponse getDashboard() {
        Map<String, Long> byRole = new LinkedHashMap<>();
        for (UserRole r : UserRole.values()) {
            byRole.put(r.name(), userRepository.countByRole(r));
        }

        long totalAgencies = agencyRepository.count();
        long activeAgencies = agencyRepository.countByIsActiveTrue();
        long activeProducts = productRepository.countByIsActiveTrue();
        long lowStock = materialRepository.countLowStockActive();
        long supDebt = supplierRepository.countByTotalDebtGreaterThan(BigDecimal.ZERO);

        List<RecentAgencyItem> recent = agencyRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(this::toRecent)
                .toList();

        return AdminDashboardResponse.builder()
                .userCountByRole(byRole)
                .totalAgencyCount(totalAgencies)
                .activeAgencyCount(activeAgencies)
                .activeProductCount(activeProducts)
                .materialLowStockCount(lowStock)
                .supplierWithPositiveDebtCount(supDebt)
                .recentAgencies(recent)
                .build();
    }

    private RecentAgencyItem toRecent(Agency a) {
        return RecentAgencyItem.builder()
                .id(a.getId())
                .name(a.getName())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
