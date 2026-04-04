package com.pcwms.backend.repository;

import com.pcwms.backend.entity.CustomerInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CustomerInteractionRepository extends JpaRepository<CustomerInteraction, Long> {
    List<CustomerInteraction> findByCustomerIdOrderByInteractionDateDesc(Long customerId);
    
    // Tìm các nhắc hẹn chưa xử lý của một nhân viên sau một thời điểm nhất định (hoặc tất cả)
    List<CustomerInteraction> findByStaffIdAndReminderDateIsNotNullAndIsResolvedFalseOrderByReminderDateAsc(Long staffId);
    
    // Tìm các nhắc hẹn đến hạn
    List<CustomerInteraction> findByReminderDateBeforeAndIsResolvedFalse(LocalDateTime now);
}
