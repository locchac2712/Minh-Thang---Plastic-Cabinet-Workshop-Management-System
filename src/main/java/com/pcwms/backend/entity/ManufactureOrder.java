package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Table(name = "manufacture_orders")
@Data
public class ManufactureOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Sản xuất dựa trên đơn hàng nào? (Trigger production)
    @ManyToOne
    @JoinColumn(name = "sales_order_id", referencedColumnName = "id", nullable = false)
    private SalesOrder salesOrder;

    // Sản xuất cái gì?
    @ManyToOne
    @JoinColumn(name = "product_id", referencedColumnName = "id", nullable = false)
    private Product product;

    @Column(name = "quantity", nullable = false)
    private Integer quantity; // Số lượng cần sản xuất

    // Trạng thái sản xuất: PLANNED, IN_PROGRESS, COMPLETED
    @Column(name = "wip_status") // WIP = Work In Progress
    private String wipStatus;

    // --- QUAN HỆ VỚI KHO ---
    // Lệnh sản xuất sẽ là nguồn gốc để xuất kho nguyên liệu (Issue Receipt)
    @OneToMany(mappedBy = "manufactureOrder")
    private List<WarehouseTransaction> warehouseTransactions;
}