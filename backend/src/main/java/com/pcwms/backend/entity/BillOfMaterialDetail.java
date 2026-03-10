package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "bom_details")
@Getter
@Setter // 👉 Sửa 1: Bỏ @Data, dùng Getter/Setter
public class BillOfMaterialDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Thuộc về BOM nào?
    @ManyToOne(fetch = FetchType.LAZY) // 👉 Tối ưu hiệu năng
    @JoinColumn(name = "bom_id", referencedColumnName = "id", nullable = false)
    @JsonIgnore // 👉 Sửa 2: Bùa chống lặp JSON
    private BillOfMaterial billOfMaterial;

    // Cần nguyên liệu gì?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "materials_id", referencedColumnName = "id", nullable = false)
    private Material material;

    // Số lượng bao nhiêu?
    // 👉 Sửa 3: Dùng BigDecimal, precision 10, scale 4 (VD: 999999.9999)
    @Column(name = "quantity_required", nullable = false, precision = 10, scale = 4)
    private BigDecimal quantityRequired;
}