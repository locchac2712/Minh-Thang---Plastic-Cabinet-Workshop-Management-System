package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sales_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 👉 ĐÃ THÊM: Mã đơn hàng (VD: SO-2026-1234)
    @Column(name = "order_number", nullable = false, unique = true)
    private String orderNumber;

    // Khóa ngoại 1: Nối với Customer
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    // Khóa ngoại 2: Nối với Báo giá (Có thể null nếu khách mua thẳng)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quotation_id")
    private Quotation quotation;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate = LocalDateTime.now();

    // Trạng thái đơn: PENDING (Chờ xử lý), PROCESSING (Đang sản xuất/soạn hàng), DELIVERED (Đã giao), CANCELLED (Hủy)
    @Column(name = "status", nullable = false)
    private String status = "PENDING";

    // Trạng thái thanh toán: UNPAID (Chưa thanh toán), PARTIAL (Thanh toán một phần), PAID (Đã thanh toán đủ)
    @Column(name = "payment_status", nullable = false)
    private String paymentStatus = "UNPAID";

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "approved_by_id")
    private Long approvedById;

    // Thời gian duyệt để sau này Kế toán đối soát
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    // Ghi chú khi duyệt (VD: "Đã duyệt tăng hạn mức vì là khách VIP lâu năm")
    @Column(name = "approval_note", columnDefinition = "TEXT")
    private String approvalNote;

    @Column(name = "priority_level", nullable = false)
    private Integer priorityLevel = 3; //default = 3, 1 = high, 2 = medium, 3 = low

    @Column(name="due_date")
    private LocalDate dueDate; // Thêm trường này để lưu ngày dự kiến giao
    // ==========================================
    // CÁC MỐI QUAN HỆ THEO ERD
    // ==========================================

    // 1. Chi tiết đơn hàng (Sản phẩm, Số lượng, Giá)
    @OneToMany(mappedBy = "salesOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<SalesOrderDetail> details = new ArrayList<>();

    // 2. Kích hoạt Lệnh Sản Xuất (Nếu trong kho hết hàng)
    @OneToMany(mappedBy = "salesOrder")
    @JsonIgnore
    private List<ManufactureOrder> manufactureOrders;

    // 3. Kích hoạt Phiếu Xuất Kho (Giao hàng cho khách)
    @OneToMany(mappedBy = "salesOrder")
    @JsonIgnore
    private List<WarehouseTransaction> warehouseTransactions;

    // 👉 Hàm Helper để add chi tiết đơn hàng (Dùng lúc đúc đơn từ Báo giá)
    public void addDetail(SalesOrderDetail detail) {
        details.add(detail);
        detail.setSalesOrder(this);
    }

    @OneToMany(mappedBy = "salesOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Payment> payments = new ArrayList<>();
}