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

    @PrePersist
    @PreUpdate
    private void validateItem(){
        boolean hasMaterial = (this.material != null);
        boolean hasProduct = (this.product != null);

        // Nếu cả 2 đều rỗng -> Chửi!
        if (!hasMaterial && !hasProduct) {
            throw new RuntimeException("Lỗi Logic: Chi tiết phiếu kho phải chứa Nguyên vật liệu hoặc Thành phẩm!");
        }

        // Nếu cả 2 đều có dữ liệu cùng 1 dòng -> Chửi!
        if (hasMaterial && hasProduct) {
            throw new RuntimeException("Lỗi Logic: Một dòng chi tiết không thể chứa CẢ Nguyên vật liệu LẪN Thành phẩm cùng lúc!");
        }

        // Bắt luôn cả lỗi số lượng âm hoặc bằng 0
        if (this.quantity == null || this.quantity <= 0) {
            throw new RuntimeException("Lỗi Logic: Số lượng xuất/nhập kho phải lớn hơn 0!");
        }
    }
}