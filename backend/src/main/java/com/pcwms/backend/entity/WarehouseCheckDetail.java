package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "warehouse_check_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseCheckDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "warehouse_check_id",nullable = false)
    private WarehouseCheck warehouseCheck;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn (name = "material_id", nullable = false)
    private Material material;

    @Column(name = "system_quantity")
    private Integer systemQuantity;

    // Tồn kho thực tế (Thủ kho đếm bằng tay nhập vào)
    @Column(name = "actual_quantity")
    private Integer actualQuantity;

    // Độ lệch (Bằng Actual - System. Nếu âm là mất hàng, dương là thừa hàng)
    @Column(name = "difference")
    private Integer difference;
}
