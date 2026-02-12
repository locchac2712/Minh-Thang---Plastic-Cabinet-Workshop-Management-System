package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales_invoices")
@Data
public class SalesInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tax_invoice_number", unique = true)
    private String taxInvoiceNumber; // Số hóa đơn đỏ

    // Hóa đơn này của đơn hàng nào?
    @OneToOne // Quan hệ 1-1: 1 Đơn hàng có 1 hóa đơn
    @JoinColumn(name = "sales_order_id", referencedColumnName = "id", nullable = false)
    private SalesOrder salesOrder;

    @Column(name = "invoice_date")
    private LocalDateTime invoiceDate;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Column(name = "due_date")
    private LocalDateTime dueDate; // Hạn chót thanh toán

    @Column(name = "payment_status")
    private String paymentStatus; // UNPAID, PAID, OVERDUE
}