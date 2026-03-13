package com.pcwms.backend.repository;

import com.pcwms.backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    boolean existsByName(String name);

    // Tạm thời để trống, JpaRepository đã tự động bao thầu hết các lệnh CRUD
    // (Thêm, Sửa, Xóa, Tìm kiếm theo ID) cho bạn rồi.

}