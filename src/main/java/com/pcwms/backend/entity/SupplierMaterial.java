package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "supplier_materials") // Tên bảng số nhiều theo ERD
@Data
public class SupplierMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // KHÓA NGOẠI 1: Nối về Nhà cung cấp
    @ManyToOne
    @JoinColumn(name = "supplier_id", referencedColumnName = "id", nullable = false)
    private Supplier supplier;

    // KHÓA NGOẠI 2: Nối về Nguyên vật liệu
    @ManyToOne
    @JoinColumn(name = "materials_id", referencedColumnName = "id", nullable = false)
    private Material material;

    // GIÁ NHẬP (Quan trọng nhất bảng này)
    @Column(name = "purchase_price", nullable = false)
    private BigDecimal purchasePrice;
}