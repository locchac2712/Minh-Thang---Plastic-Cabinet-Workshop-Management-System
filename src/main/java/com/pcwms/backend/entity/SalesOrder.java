package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "sales_orders") // Tên bảng số nhiều theo ERD
@Data
public class SalesOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // KHÓA NGOẠI: Khách hàng nào đặt?
    @ManyToOne
    @JoinColumn(name = "customer_id", referencedColumnName = "id", nullable = false)
    private Customer customer;

    @Column(name = "created_date")
    private LocalDateTime createdDate; // Ngày tạo đơn

    // Trạng thái đơn: NEW, CONFIRMED, PRODUCING, COMPLETED, CANCELLED
    @Column(name = "status")
    private String status;

    // Trạng thái thanh toán: UNPAID, PARTIAL, PAID
    @Column(name = "payment_status")
    private String paymentStatus;

    @Column(name = "total_amount")
    private BigDecimal totalAmount; // Tổng tiền đơn hàng

    // --- QUAN HỆ CHỜ SẴN ---
    // 1 Đơn hàng có nhiều chi tiết
    @OneToMany(mappedBy = "salesOrder")
    private List<SalesOrderDetail> details;

    // 1 Đơn hàng sinh ra nhiều lệnh sản xuất
    @OneToMany(mappedBy = "salesOrder")
    private List<ManufactureOrder> manufactureOrders;
}