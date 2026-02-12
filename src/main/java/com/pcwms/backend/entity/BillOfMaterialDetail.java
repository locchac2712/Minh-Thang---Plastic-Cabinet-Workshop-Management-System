package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "bom_details")
@Data
public class BillOfMaterialDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Thuộc về BOM nào?
    @ManyToOne
    @JoinColumn(name = "bom_id", referencedColumnName = "id", nullable = false)
    private BillOfMaterial billOfMaterial;

    // Cần nguyên liệu gì?
    @ManyToOne
    @JoinColumn(name = "materials_id", referencedColumnName = "id", nullable = false)
    private Material material;

    // Số lượng bao nhiêu?
    @Column(name = "quantity_required", nullable = false)
    private Double quantityRequired;
}