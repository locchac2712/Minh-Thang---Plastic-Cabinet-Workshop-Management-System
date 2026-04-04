package com.pcwms.backend.repository;

import com.pcwms.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByPayosPaymentLinkId(String payosPaymentLinkId);
    Optional<Payment> findByPayosOrderCode(Long payosOrderCode);
    // Chỉ lấy những giao dịch đã thực sự nhận được tiền
    List<Payment> findBySalesOrderIdAndPayosStatusOrderByIdDesc(Long orderId, String status);

    List<Payment> findBySalesOrderIdOrderByIdDesc(Long orderId);

    // Dùng cho Dashboard: Lấy tất cả payment trong khoảng thời gian
    List<Payment> findByTransactionDateBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    // Lọc theo trạng thái PayOS
    List<Payment> findByTransactionDateBetweenAndPayosStatus(java.time.LocalDateTime start, java.time.LocalDateTime end, String status);
}
