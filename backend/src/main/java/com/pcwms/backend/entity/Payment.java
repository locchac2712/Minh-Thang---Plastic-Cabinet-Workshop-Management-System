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


    // payOS-specific fields (chỉ có dữ liệu nếu paymentMethod = "PAYOS")
    // Loại thanh toán: FULL | DEPOSIT
    @Column(name = "payos_payment_type")
    private String payosPaymentType;

    // ID link do PayOS cấp — dùng để query trạng thái & huỷ
    @Column(name = "payos_payment_link_id", unique = true)
    private String payosPaymentLinkId;

    // Mã order do mình sinh ra gửi lên PayOS (long ≤ 9 chữ số, unique)
    @Column(name = "payos_order_code", unique = true)
    private Long payosOrderCode;

    // URL trang thanh toán PayOS (fallback nếu không quét được QR)
    @Column(name = "payos_checkout_url", length = 500)
    private String payosCheckoutUrl;

    // URL ảnh QR trả về từ PayOS
    @Column(name = "payos_qr_code", length = 500)
    private String payosQrCode;

    // Trạng thái giao dịch PayOS: PENDING | PAID | CANCELLED | EXPIRED
    @Column(name = "payos_status")
    private String payosStatus;

    // Thời điểm PayOS xác nhận thanh toán thành công (từ webhook)
    @Column(name = "payos_paid_at")
    private LocalDateTime payosPaidAt;

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    public boolean isPayOSPayment() {
        return "PAYOS".equalsIgnoreCase(this.paymentMethod);
    }

    public boolean isPayOSPaid() {
        return "PAID".equalsIgnoreCase(this.payosStatus);
    }
}