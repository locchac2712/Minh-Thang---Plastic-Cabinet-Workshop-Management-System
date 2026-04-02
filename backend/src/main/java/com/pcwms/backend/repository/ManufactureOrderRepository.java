package com.pcwms.backend.repository;

import com.pcwms.backend.entity.ManufactureOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ManufactureOrderRepository extends JpaRepository<ManufactureOrder, Long> {
    // Lấy tất cả các lệnh sản xuất để vẽ lên Lịch (Loại bỏ các lệnh đã bị hủy)
    @Query("SELECT m FROM ManufactureOrder m WHERE m.status != 'CANCELLED' ORDER BY m.startDate ASC")
    List<ManufactureOrder> findAllForCalendar();
}
