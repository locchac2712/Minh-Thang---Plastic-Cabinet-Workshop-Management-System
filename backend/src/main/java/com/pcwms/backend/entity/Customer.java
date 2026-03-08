package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "customer")
@Data
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 1. ĐÃ SỬA: Đổi từ companyName thành name cho khớp đúng chữ "Name" trên ERD mới
    @Column(name = "name", nullable = false)
    private String name;

    // 👉 2. BƠM THÊM: Email (Để gửi báo giá/hóa đơn)
    @Column(name = "email")
    private String email;

    // 👉 3. BƠM THÊM: Số điện thoại (Để Sale sale-call)
    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "address")
    private String address;

    @Column(name = "tax_code")
    private String taxCode;

    @Column(name = "credit_limit")
    private BigDecimal creditLimit;

    @Column(name = "current_debt")
    private BigDecimal currentDebt;

    // Tạm thời cứ comment lại OneToMany, khi nào cần truy vấn ngược từ Khách hàng ra danh sách Đơn hàng/Báo giá thì mở ra sau để tránh nặng Database.
    // @OneToMany(mappedBy = "customer")
    // private List<Quotation> quotations;

    // @OneToMany(mappedBy = "customer")
    // private List<SalesOrder> salesOrders;
}