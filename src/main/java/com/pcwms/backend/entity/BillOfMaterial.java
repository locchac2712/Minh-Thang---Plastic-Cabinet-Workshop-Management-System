package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Table(name = "bill_of_materials")
@Data
public class BillOfMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mỗi BOM gắn chặt với 1 Sản phẩm
    @ManyToOne
    @JoinColumn(name = "product_id", referencedColumnName = "id", nullable = false)
    private Product product;

    @Column(name = "is_approved")
    private Boolean isApproved = false; // Đã duyệt chưa

    @Column(name = "is_active")
    private Boolean isActive = true; // Có đang dùng không

    @OneToMany(mappedBy = "billOfMaterial")
    private List<BillOfMaterialDetail> bomDetails;
}