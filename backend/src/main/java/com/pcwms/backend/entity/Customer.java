package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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

    @Column(name = "credit_limit",precision = 15, scale = 2)
    private BigDecimal creditLimit;

    @Column(name = "current_debt",precision = 15, scale = 2)
    private BigDecimal currentDebt;

    @OneToMany(mappedBy = "customer")
    @JsonIgnore
    private List<Quotation> quotations;

    @OneToMany(mappedBy = "customer")
    @JsonIgnore
    private List<SalesOrder> salesOrders;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    // --- CRM ENHANCEMENTS ---
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "customer_type")
    private String customerType; // RETAIL, DISTRIBUTOR, PROJECT

    @Column(name = "source")
    private String source; // FACEBOOK, ZALO, WEBSITE, REFERRAL

    @Column(name = "birthday")
    private LocalDate birthday;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private Staff assignedTo;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}