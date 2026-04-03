package com.pcwms.backend.repository;

import com.pcwms.backend.entity.ManufactureOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ManufactureOrderRepository extends JpaRepository<ManufactureOrder, Long> {
    // Lấy tất cả các lệnh sản xuất để vẽ lên Lịch (Eager fetch SalesOrder và Customer)
    @Query("SELECT m FROM ManufactureOrder m " +
           "JOIN FETCH m.salesOrder s " +
           "LEFT JOIN FETCH s.customer c " +
           "JOIN FETCH m.product p " +
           "WHERE m.status != 'CANCELLED' " +
           "ORDER BY m.startDate ASC")
    List<ManufactureOrder> findAllForCalendar();


}
