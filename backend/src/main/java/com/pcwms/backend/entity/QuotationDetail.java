package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "quotation_details")
@Data
public class QuotationDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Khóa ngoại: Dòng chi tiết này thuộc về tờ Báo giá nào?
    @ManyToOne
    @JoinColumn(name = "quotation_id", referencedColumnName = "id", nullable = false)
    private Quotation quotation;

    // Khóa ngoại: Bán mặt hàng gì?
    @ManyToOne
    @JoinColumn(name = "product_id", referencedColumnName = "id", nullable = false)
    private Product product;

    // Số lượng khách định mua
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    // Đơn giá lúc báo giá (Lưu lại đề phòng sau này giá Product trong kho thay đổi)
    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    // Tiền chiết khấu/giảm giá cho riêng mặt hàng này
    @Column(name = "discount")
    private BigDecimal discount;

    // 👉 HÀM BẢO VỆ DATABASE (Giống cách bạn làm bên TransactionDetail)
    @PrePersist
    @PreUpdate
    private void validateDetail() {
        if (this.quantity == null || this.quantity <= 0) {
            throw new RuntimeException("Lỗi Logic: Số lượng báo giá phải lớn hơn 0!");
        }
        if (this.unitPrice == null || this.unitPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Lỗi Logic: Đơn giá không được để trống hoặc số âm!");
        }
    }
}