package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "manufacture_orders")
@Data
public class ManufactureOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 👉 ĐÃ THÊM: Mã Lệnh Sản Xuất (VD: MO-2026-0001)
    @Column(name = "mo_number", nullable = false, unique = true)
    private String moNumber;

    // Sản xuất dựa trên đơn hàng nào? (Trigger production)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_order_id", referencedColumnName = "id", nullable = false)
    private SalesOrder salesOrder;

    // Sản xuất cái gì?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", referencedColumnName = "id", nullable = false)
    private Product product;

    @Column(name = "quantity", nullable = false)
    private Integer quantity; // Số lượng cần sản xuất

    // 👉 ĐÃ SỬA: Trạng thái lệnh sản xuất (PLANNED, IN_PROGRESS, COMPLETED, CANCELLED)
    @Column(name = "status", nullable = false)
    private String status = "PLANNED";

    // 👉 ĐÃ THÊM: Ngày dự kiến bắt đầu làm
    @Column(name = "start_date")
    private LocalDateTime startDate;

    // 👉 ĐÃ THÊM: Ngày dự kiến giao hàng (Deadline của xưởng)
    @Column(name = "end_date")
    private LocalDateTime endDate;

    // 👉 GỢI Ý THÊM: Ngày thực tế đóng xong (Dùng để tính KPI xưởng)
    @Column(name = "actual_end_date")
    private LocalDateTime actualEndDate;

    // 👉 GỢI Ý THÊM: Ghi chú kỹ thuật cho thợ
    @Column(name = "technical_notes", columnDefinition = "TEXT")
    private String technicalNotes;

    // --- QUAN HỆ VỚI KHO ---
    // Lệnh sản xuất sẽ là nguồn gốc để xuất kho nguyên liệu (Issue Receipt)
    @OneToMany(mappedBy = "manufactureOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore // Chặn lỗi đệ quy vòng lặp JSON
    private List<WarehouseTransaction> warehouseTransactions;
}