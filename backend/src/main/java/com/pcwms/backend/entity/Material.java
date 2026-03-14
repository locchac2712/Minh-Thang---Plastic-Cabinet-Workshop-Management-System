package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "materials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String sku;      // Mã kho (Stock Keeping Unit)

    @Column(nullable = false)
    private String unit;     // Đơn vị tính (Khối, Hộp, Lít...)

    // 👉 CHUẨN KẾ TOÁN: Dùng BigDecimal thay cho Double, và đổi tên thành Giá vốn trung bình (Theo ERD)
    @Column(name = "average_unit_cost", precision = 15, scale = 2)
    private BigDecimal averageUnitCost = BigDecimal.ZERO;

    @Column(name = "current_stock", nullable = false)
    private Integer currentStock = 0; // Tồn kho hiện tại

    @Column(name = "min_stock_level")
    private Integer minStockLevel = 0; // Ngưỡng báo động đỏ

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active")
    private Boolean isActive = true; // Trạng thái sử dụng (Đổi active thành isActive cho chuẩn Java Bean)

    // 👉 BẮT BUỘC: Khóa lạc quan chống xung đột khi cập nhật tồn kho
    @Version
    private Long version;


    // ==========================================
    // CÁC MỐI QUAN HỆ (MAPPING NGƯỢC)
    // ==========================================

    // 1. Quan hệ với bảng trung gian Nhà Cung Cấp
    @OneToMany(mappedBy = "material")
    @JsonIgnore
    private List<SupplierMaterial> supplierMaterials;

    // 2. Quan hệ với Chi tiết Định mức sản xuất (BOM Details)
    @OneToMany(mappedBy = "material")
    @JsonIgnore
    private List<BillOfMaterialDetail> billOfMaterialDetails;

    // 3. Quan hệ với Chi tiết Phiếu kho (Transaction Details)
    @OneToMany(mappedBy = "material")
    @JsonIgnore
    private List<TransactionDetail> transactionDetails;

    // 4. Quan hệ với Chi tiết Phiếu kiểm kê kho (Warehouse Check Details)
    @OneToMany(mappedBy = "material")
    @JsonIgnore
    private List<WarehouseCheckDetail> warehouseCheckDetails;
}