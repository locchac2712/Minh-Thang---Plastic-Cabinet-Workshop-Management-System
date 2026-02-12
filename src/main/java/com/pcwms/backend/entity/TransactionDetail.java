package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "transaction_details")
@Data
public class TransactionDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Thuộc về phiếu kho nào?
    @ManyToOne
    @JoinColumn(name = "warehouse_transaction_id", referencedColumnName = "id", nullable = false)
    private WarehouseTransaction warehouseTransaction;

    // Nếu là giao dịch Nguyên vật liệu (Mua hàng, Xuất sản xuất)
    @ManyToOne
    @JoinColumn(name = "materials_id", referencedColumnName = "id")
    private Material material;

    // Nếu là giao dịch Thành phẩm (Bán hàng, Nhập từ sản xuất)
    @ManyToOne
    @JoinColumn(name = "product_id", referencedColumnName = "id")
    private Product product;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;
}