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
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Customer customer;

    // Mở file Quotation.java, tìm đến đoạn Staff:
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    @JsonIgnoreProperties({"user", "department", "phoneNumber"}) // 👉 DÙNG CÁI NÀY: Chỉ lấy ID và Tên, bỏ qua các trường nhạy cảm
    private Staff staff;

    @Column(name = "created_date")
    private LocalDateTime createdDate = LocalDateTime.now();

    @Column(name = "valid_until")
    private LocalDateTime validUntil;

    // Tổng tiền của cả tờ báo giá
    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(length = 50)
    private String status = "DRAFT";

    // 👉 Đã thêm Note theo yêu cầu
    @Column(columnDefinition = "TEXT")
    private String note;

    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuotationDetail> details = new ArrayList<>();

    public void addDetail(QuotationDetail detail) {
        details.add(detail);
        detail.setQuotation(this);
    }


}