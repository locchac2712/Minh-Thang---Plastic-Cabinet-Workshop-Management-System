package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "production_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plan_name", nullable = false)
    private String planName;

    @OneToOne
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    // Trạng thái kế hoạch: PLANNED (Chờ sản xuất), IN_PROGRESS (Đang sản xuất), COMPLETED (Hoàn tất)
    @Column(name = "status", nullable = false)
    private String status = "PLANNED";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "productionPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("productionPlan")
    private List<ManufactureOrder> manufactureOrders = new ArrayList<>();

    public void addManufactureOrder(ManufactureOrder mo) {
        manufactureOrders.add(mo);
        mo.setProductionPlan(this);
    }
}
