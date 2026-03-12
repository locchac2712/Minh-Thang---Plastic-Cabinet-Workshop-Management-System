package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "warehouse_transactions")
@Data
public class WarehouseTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private TransactionType type;

    @ManyToOne
    @JoinColumn(name = "manufacture_order_id")
    private ManufactureOrder manufactureOrder;

    // 2. Nếu phiếu này sinh ra từ Đơn hàng bán
    @ManyToOne
    @JoinColumn(name = "sales_order_id")
    private SalesOrder salesOrder;

    //Nếu có phiếu Nhập kho từ Mua hàng (Supplier) thì sau này mở comment ra nhé
    // @ManyToOne
    // @JoinColumn(name = "purchase_invoice_id")
    // private PurchaseInvoice purchaseInvoice;

    // Dùng để lưu mã code viết tay (VD: "XUAT-KHO-001") hoặc số hóa đơn VAT đỏ
    @Column(name = "reference_id")
    private String referenceId;

    @Column(name = "date")
    private LocalDateTime date;

    // Nhân viên nào thực hiện giao dịch này?
    @ManyToOne
    @JoinColumn(name = "staff_id", referencedColumnName = "id", nullable = false)
    private Staff staff;

    // Một phiếu có nhiều dòng chi tiết
    @OneToMany(mappedBy = "warehouseTransaction", cascade = CascadeType.ALL)
    private List<TransactionDetail> details;
}