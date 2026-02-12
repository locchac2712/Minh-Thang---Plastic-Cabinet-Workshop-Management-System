package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal; // Dùng cái này cho tiền nong để chính xác

@Entity
@Table(name = "customer")
@Data
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // LIÊN KẾT VỚI USERS
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    // Các trường theo đúng ERD
    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "address")
    private String address;

    @Column(name = "tax_code")
    private String taxCode; // Mã số thuế

    @Column(name = "credit_limit")
    private BigDecimal creditLimit; // Hạn mức tín dụng (Dùng BigDecimal cho tiền)

    @Column(name = "current_debt")
    private BigDecimal currentDebt; // Nợ hiện tại

    // @OneToMany(mappedBy = "customer")
    // private List<SalesOrder> salesOrders;
}