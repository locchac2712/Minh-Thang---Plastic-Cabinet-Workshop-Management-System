package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nếu Khách trả tiền -> Cột này có dữ liệu
    @ManyToOne
    @JoinColumn(name = "customer_id", referencedColumnName = "id", nullable = true)
    private Customer customer;

    // Trả cho đơn hàng nào?
    @ManyToOne
    @JoinColumn(name = "sales_order_id", referencedColumnName = "id", nullable = true)
    private SalesOrder salesOrder;

    // Nếu Trả tiền cho NCC -> Cột này có dữ liệu
    @ManyToOne
    @JoinColumn(name = "supplier_id", referencedColumnName = "id", nullable = true)
    private Supplier supplier;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "transaction_date")
    private LocalDateTime transactionDate;

    // Phương thức: CASH, TRANSFER, CREDIT_CARD...
    @Column(name = "payment_method")
    private String paymentMethod;
}