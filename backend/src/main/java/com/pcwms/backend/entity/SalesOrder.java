package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales_orders")
@Data
public class SalesOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Khóa ngoại 1: Nối với Customer (Bắt buộc phải có)
    @ManyToOne
    @JoinColumn(name = "customer_id", referencedColumnName = "id", nullable = false)
    private Customer customer;

    // 👉 Khóa ngoại 2 (MỚI THÊM): Nối với Báo giá
    // (Lưu ý: Không để nullable = false, vì khách quen có thể lên đơn thẳng không cần báo giá)
    @ManyToOne
    @JoinColumn(name = "quotation_id", referencedColumnName = "id")
    private Quotation quotation;

    // 👉 KHÔI PHỤC LẠI: Ngày tạo đơn (Để kế toán còn biết đường chốt sổ)
    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    // Các cột cơ bản theo ERD
    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "payment_status", nullable = false)
    private String paymentStatus;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;
}