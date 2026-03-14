package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "transaction_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Thuộc về phiếu kho nào? (Dùng LAZY để tối ưu hiệu năng)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_transaction_id", referencedColumnName = "id", nullable = false)
    private WarehouseTransaction warehouseTransaction;

    // Nếu là giao dịch Nguyên vật liệu (Mua hàng, Xuất sản xuất)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "materials_id", referencedColumnName = "id")
    private Material material;

    // Nếu là giao dịch Thành phẩm (Bán hàng, Nhập từ sản xuất)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", referencedColumnName = "id")
    private Product product;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    // 👉 BỔ SUNG THEO ERD MỚI: Đơn giá tại thời điểm nhập/xuất
    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    // 👉 BỔ SUNG THEO ERD MỚI: Thành tiền = Số lượng * Đơn giá
    @Column(name = "total_line_amount", precision = 15, scale = 2)
    private BigDecimal totalLineAmount = BigDecimal.ZERO;

    // --- LOGIC CHẶN DỮ LIỆU RÁC CỦA LEAD (RẤT CHUẨN) ---
    @PrePersist
    @PreUpdate
    private void validateItem() {
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

        // (Tùy chọn) Có thể bắt thêm lỗi Giá trị âm nếu muốn khắt khe về Kế toán
        if (this.unitPrice != null && this.unitPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Lỗi Logic: Đơn giá không được là số âm!");
        }
    }
}