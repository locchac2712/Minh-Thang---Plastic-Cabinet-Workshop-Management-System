package com.pcwms.backend.repository;

import com.pcwms.backend.entity.TransactionType;
import com.pcwms.backend.entity.WarehouseTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarehouseTransactionRepository extends JpaRepository<WarehouseTransaction, Long> {
    // 1. Lấy danh sách phân trang (Không tìm kiếm)
    Page<WarehouseTransaction> findByType(TransactionType type, Pageable pageable);

    // 2. Lấy danh sách phân trang + Tìm kiếm theo Mã chứng từ (Reference ID) hoặc Tên thủ kho
    @Query("SELECT w FROM WarehouseTransaction w WHERE w.type = :type " +
            "AND (LOWER(w.referenceId) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(w.staff.fullname) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<WarehouseTransaction> searchByTypeAndKeyword(
            @Param("type") TransactionType type,
            @Param("keyword") String keyword,
            Pageable pageable);
}
