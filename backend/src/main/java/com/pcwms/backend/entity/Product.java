package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "product") // Tên bảng số ít theo hình ERD
@Data
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "sku", nullable = false, unique = true)
    private String sku;

    @Column(name = "selling_price")
    private BigDecimal sellingPrice;

    @Column(name = "current_stock", nullable = false)
    private Integer currentStock = 0;

    @Column(name = "unit" , nullable = false)
    private String unit;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ProductStatus status = ProductStatus.DRAFT;

    // --- CÁC MỐI QUAN HỆ ---

    // 1. Quan hệ với Sales Order Details (included in)
    @OneToMany(mappedBy = "product")
    private List<SalesOrderDetail> salesOrderDetails;

    //2. Quan hệ với Manufacture Orders (to produce)
    @OneToMany(mappedBy = "product")
    private List<ManufactureOrder> manufactureOrders;

    // 3. Quan hệ với Bill of Materials (has version)
    @OneToMany(mappedBy = "product")
    private List<BillOfMaterial> billOfMaterials;

    // 4. Quan hệ với Transaction Details (details)
    @OneToMany(mappedBy = "product")
    private List<TransactionDetail> transactionDetails;
}