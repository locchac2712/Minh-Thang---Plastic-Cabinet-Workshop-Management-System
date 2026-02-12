package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Table(name = "materials") // Theo hình ERD tên bảng là số nhiều
@Data
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "unit")
    private String unit; // Ví dụ: kg, mét, cái

    @Column(name = "min_stock_level")
    private Integer minStockLevel;

    @Column(name = "current_stock")
    private Integer currentStock;

    // --- CÁC MỐI QUAN HỆ  ---

    @OneToMany(mappedBy = "material")
    private List<SupplierMaterial> supplierMaterials;

    @OneToMany(mappedBy = "material")
    private List<BillOfMaterialDetail> bomDetails;
}