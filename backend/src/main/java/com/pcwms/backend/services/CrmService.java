package com.pcwms.backend.services;

import com.pcwms.backend.dto.response.CrmDashboardResponse;
import com.pcwms.backend.entity.Payment;
import com.pcwms.backend.entity.SalesOrder;
import com.pcwms.backend.repository.CustomerRepository;
import com.pcwms.backend.repository.PaymentRepository;
import com.pcwms.backend.repository.SalesOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CrmService {

    private final CustomerRepository customerRepository;
    private final PaymentRepository  paymentRepository;
    private final SalesOrderRepository salesOrderRepository;

    public CrmDashboardResponse getMonthlyStats(int month, int year) {
        LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime end   = start.plusMonths(1).minusNanos(1);

        // 1. Thực thu (Actual Revenue) - Các thanh toán PAID/SUCCESS trong tháng
        List<Payment> payments = paymentRepository.findByTransactionDateBetweenAndPayosStatus(start, end, "PAID");
        BigDecimal actualRevenue = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Nợ mới (New Debt) - Các đơn hàng tạo trong tháng: Tổng tiền - Đã thanh toán
        List<SalesOrder> orders = salesOrderRepository.findByCreatedDateBetween(start, end);
        BigDecimal totalOrderAmount = orders.stream()
                .map(s -> s.getTotalAmount() != null ? s.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Giả sử nợ mới = Tổng tiền hàng mới - (Tiền đã thu cho các đơn hàng NÀY)
        BigDecimal paidForNewOrders = orders.stream()
                .map(s -> s.getPayments() != null ? 
                    s.getPayments().stream()
                        .filter(p -> "PAID".equals(p.getPayosStatus()))
                        .map(Payment::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add) : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal newDebt = totalOrderAmount.subtract(paidForNewOrders);

        // 3. Khách hàng mới trong tháng (Sử dụng trường createdAt mới)
        long totalNewCustomers = customerRepository.findAll().stream()
                .filter(c -> c.getCreatedAt() != null && 
                            !c.getCreatedAt().isBefore(start) && 
                            !c.getCreatedAt().isAfter(end))
                .count();
        
        long activeCount = customerRepository.findByActiveTrue().size();
        long inactiveCount = customerRepository.findByActiveFalse().size();

        return CrmDashboardResponse.builder()
                .actualRevenue(actualRevenue)
                .newDebt(newDebt)
                .totalNewCustomers((int) totalNewCustomers)
                .totalActiveCustomers(activeCount)
                .totalInactiveCustomers(inactiveCount)
                .build();
    }
}
