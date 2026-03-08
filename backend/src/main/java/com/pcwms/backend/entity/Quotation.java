package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "quotations")
@Data
public class Quotation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mã báo giá (VD: BG-2026-001). Cột này bắt buộc phải Unique (duy nhất)
    @Column(name = "quotation_number", nullable = false, unique = true)
    private String quotationNumber;

    // Khóa ngoại: Báo giá này gửi cho Khách hàng nào?
    @ManyToOne
    @JoinColumn(name = "customer_id", referencedColumnName = "id", nullable = false)
    private Customer customer;

    // Khóa ngoại: Nhân viên Sale nào làm báo giá này?
    @ManyToOne
    @JoinColumn(name = "staff_id", referencedColumnName = "id", nullable = false)
    private Staff staff;

    // Ngày tạo báo giá (Lưu cả giờ phút giây)
    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    // Hạn chốt báo giá (Chỉ cần lưu ngày tháng năm)
    @Column(name = "valid_until", nullable = false)
    private LocalDate validUntil;

    // Tổng tiền của cả tờ báo giá (Dùng BigDecimal cho chuẩn tài chính)
    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    // Trạng thái báo giá (DRAFT: Nháp, SENT: Đã gửi, ACCEPTED: Đã chốt, REJECTED: Hủy)
    @Column(name = "status", nullable = false)
    private String status;
}