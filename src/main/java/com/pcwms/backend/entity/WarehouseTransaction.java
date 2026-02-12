package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "warehouse_transactions")
@Data
public class WarehouseTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Loại giao dịch: NHẬP hay XUẤT
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private TransactionType type;

    // 1. Nếu phiếu này sinh ra từ Lệnh sản xuất (Xuất nguyên liệu / Nhập thành phẩm)
    @ManyToOne
    @JoinColumn(name = "manufacture_order_id")
    private ManufactureOrder manufactureOrder;

    // 2. Nếu phiếu này sinh ra từ Đơn hàng bán (Xuất hàng bán)
    @ManyToOne
    @JoinColumn(name = "sales_order_id")
    private SalesOrder salesOrder;

    // @Column(name = "reference_id")
    // private String referenceId;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    // Nhân viên nào thực hiện giao dịch này? (Quan hệ với Staff)
    @ManyToOne
    @JoinColumn(name = "staff_id", referencedColumnName = "id", nullable = false)
    private Staff staff;

    // --- QUAN HỆ ---
    // Một phiếu có nhiều dòng chi tiết
    @OneToMany(mappedBy = "warehouseTransaction", cascade = CascadeType.ALL)
    private List<TransactionDetail> details;
}