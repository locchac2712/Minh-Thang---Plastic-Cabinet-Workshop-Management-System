package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Table(name = "materials")
@Data
public class Material {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String sku;      // Mã kho (Stock Keeping Unit)
    private String unit;     // Đơn vị tính (Kg, mét, cái...)

    private Double price;    // Giá nhập gần nhất

    private Integer currentStock; // Tồn kho hiện tại

    // 👉 TRƯỜNG MỚI: Ngưỡng báo động
    private Integer minStockLevel = 0;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Boolean active = true; // Trạng thái sử dụng

    @OneToMany(mappedBy = "material")
    @JsonIgnore
    private List<SupplierMaterial> supplierMaterials;
}