package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "warehouse_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Loại phiếu (IMPORT - Nhập, EXPORT - Xuất, ADJUSTMENT - Điều chỉnh kiểm kê)
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private TransactionType type;

    // 👉 MỚI: Trạng thái phiếu (DRAFT, COMPLETED, CANCELLED) theo đúng chuẩn ERD
    @Column(name = "status", length = 50)
    private String status = "DRAFT";

    // Dùng để lưu mã code (VD: "PNK-2026-001", "PXK-2026-002")
    @Column(name = "reference_id")
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private String referenceId;

    @Column(name = "date")
    private LocalDateTime date = LocalDateTime.now();

    // --- CÁC MỐI QUAN HỆ (Nguồn gốc sinh ra phiếu kho) ---

    // 1. Sinh ra từ Lệnh sản xuất (Xuất vật tư / Nhập thành phẩm)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacture_order_id")
    private ManufactureOrder manufactureOrder;

    // 2. Sinh ra từ Đơn bán hàng (Xuất thành phẩm giao khách)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_order_id")
    private SalesOrder salesOrder;

    // 3. Sinh ra từ Hóa đơn mua hàng (Nhập vật tư từ NCC) - Đã mở khóa!
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_invoice_id")
    private PurchaseInvoice purchaseInvoice;

    // Nhân viên thực hiện giao dịch (Thủ kho)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private Staff staff;

    // --- CHI TIẾT PHIẾU KHO ---
    // Một phiếu có nhiều dòng chi tiết
    @OneToMany(mappedBy = "warehouseTransaction", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore // Bắt buộc để tránh lỗi đệ quy JSON
    private List<TransactionDetail> details = new ArrayList<>();

    // 👉 Hàm Helper đồng bộ khóa ngoại 2 chiều (Best Practice của Hibernate)
    public void addDetail(TransactionDetail detail) {
        details.add(detail);
        detail.setWarehouseTransaction(this);
    }
}