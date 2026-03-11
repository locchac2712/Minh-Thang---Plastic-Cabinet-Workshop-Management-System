package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bill_of_materials")
@Getter
@Setter
public class BillOfMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 👉 THÊM LẠI TRƯỜNG VERSION: Phân biệt các phiên bản công thức của cùng 1 sản phẩm
    @Column(name = "version", nullable = false)
    private String version;

//    @Column(name = "is_approved", nullable = false)
//    private Boolean isApproved = false;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // 1. Quan hệ N-1 với Product (Thành phẩm)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    // 2. Quan hệ 1-N với BillOfMaterialDetail (Chi tiết BOM)
    @OneToMany(mappedBy = "billOfMaterial", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BillOfMaterialDetail> bomDetails = new ArrayList<>();

    public void addBomDetail(BillOfMaterialDetail detail) {
        bomDetails.add(detail);
        detail.setBillOfMaterial(this);
    }
}