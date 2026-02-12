package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_invoices")
@Data
public class PurchaseInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_date")
    private LocalDateTime invoiceDate;

    @Column(name = "tax_invoice_number")
    private String taxInvoiceNumber; // Số hóa đơn phía NCC gửi

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Column(name = "status")
    private String status; // PENDING, APPROVED, PAID

    // --- QUAN HỆ ---
    // Theo ERD: Hóa đơn này đến từ Phiếu nhập kho nào (source of GRN)
    // GRN = Goods Receipt Note (Phiếu nhập kho)
    // Lưu ý: Có thể 1 hóa đơn gộp nhiều phiếu nhập, hoặc 1 phiếu nhập 1 hóa đơn
    // Để đơn giản theo ERD, ta nối với Supplier trước (receives)

    @ManyToOne
    @JoinColumn(name = "supplier_id", referencedColumnName = "id")
    private Supplier supplier;
}