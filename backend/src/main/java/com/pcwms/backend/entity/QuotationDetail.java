package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "quotation_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quotation_id", nullable = false)
    @JsonIgnore // 👉 GẮN CÁI KHIÊN NÀY VÀO ĐÂY LÀ CHẶN ĐỨNG VÒNG LẶP!
    private Quotation quotation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "billOfMaterials", "salesOrderDetails"})
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", precision = 15, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    // 👉 Giữ nguyên tên là discount theo đúng ERD
    @Column(name = "discount", precision = 15, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    // Thành tiền của riêng dòng này = (Số lượng * Đơn giá) - discount
    @Column(name = "total_line_amount", precision = 15, scale = 2)
    private BigDecimal totalLineAmount;
}