package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "scrap_reports")
@Data
public class ScrapReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Lỗi xảy ra ở lệnh sản xuất nào?
    @ManyToOne
    @JoinColumn(name = "manufacture_order_id", referencedColumnName = "id", nullable = false)
    private ManufactureOrder manufactureOrder;

    // Nguyên liệu nào bị hỏng?
    @ManyToOne
    @JoinColumn(name = "material_id", referencedColumnName = "id", nullable = false)
    private Material material;

    @Column(name = "quantity", nullable = false)
    private Double quantity; // Số lượng hỏng

    @Column(name = "reason")
    private String reason; // Lý do (Gãy, vỡ, sai quy cách...)
}