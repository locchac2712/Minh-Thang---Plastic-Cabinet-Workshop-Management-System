package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Entity
@Table(name = "manufacture_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManufactureOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Sản xuất dựa trên đơn hàng nào? (Trigger production)
    @ManyToOne
    @JoinColumn(name = "sales_order_id", referencedColumnName = "id", nullable = false)
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", referencedColumnName = "id", nullable = false)
    private Product product;

    // Kế hoạch sản xuất chứa lệnh này
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "production_plan_id")
    @JsonIgnoreProperties("manufactureOrders")
    private ProductionPlan productionPlan;

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