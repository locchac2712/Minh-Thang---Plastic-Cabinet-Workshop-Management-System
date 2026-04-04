package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quotations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Quotation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quotation_number", unique = true, nullable = false)
    private String quotationNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Customer customer;

    // Mở file Quotation.java, tìm đến đoạn Staff:
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    @JsonIgnoreProperties({ "user", "department", "phoneNumber" }) // 👉 DÙNG CÁI NÀY: Chỉ lấy ID và Tên, bỏ qua các
                                                                   // trường nhạy cảm
    private Staff staff;

    @Column(name = "created_date")
    private LocalDateTime createdDate = LocalDateTime.now();

    @Column(name = "valid_until")
    private LocalDateTime validUntil;

    // Chiết khấu tổng của cả báo giá (%)
    @Column(name = "discount_percent", precision = 5, scale = 2)
    private BigDecimal discountPercent = BigDecimal.ZERO;

    // Tổng tiền của cả báo giá
    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(length = 50)
    private String status = "DRAFT";

    // 👉 Đã thêm Note theo yêu cầu
    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuotationDetail> details = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.createdDate == null)
            this.createdDate = LocalDateTime.now();
        // Mặc định thời hạn báo giá là 15 ngày kể từ ngày tạo
        if (this.validUntil == null) {
            this.validUntil = this.createdDate.plusDays(15);
        }
    }

    public void addDetail(QuotationDetail detail) {
        details.add(detail);
        detail.setQuotation(this);
    }

}