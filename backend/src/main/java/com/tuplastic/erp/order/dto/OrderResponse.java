package com.tuplastic.erp.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private UUID id;
    private UUID agencyId;
    private String agencyName;
    private String agencyPhone;
    private String agencyEmail;
    private String agencyLegalName;
    private String agencyTaxCode;
    private UUID createdById;
    private String createdByName;
    private UUID approverId;
    private String approverName;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal shippingFee;
    private BigDecimal totalPayable;
    private BigDecimal paidAmount;
    private LocalDate expectedDeliveryDate;
    /** Hạn hiệu lực báo giá; null = không giới hạn. */
    private LocalDate quotationValidUntil;
    /** Đơn/báo giá gốc khi tạo từ copy UI. */
    private UUID sourceOrderId;
    /** Mã hiển thị báo giá gốc (khi có sourceOrder). */
    private String sourceDisplayCode;
    /** {@code quotation} | {@code fulfillment} — phân biệt lens list/detail. */
    private String recordKind;
    /** Mã hiển thị: BG-YYYY-NNNNN hoặc DH-YYYY-NNNNN. */
    private String displayCode;
    private String shippingAddress;
    private String status;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderItemResponse> items;
    /** Biên LN gộp % (ước tính từ giá vốn SP) — chỉ populate cho API Giám đốc duyệt đơn. */
    private BigDecimal marginPercent;
    /** Ngưỡng biên tối thiểu nội bộ % — chỉ populate cho API Giám đốc duyệt đơn. */
    private BigDecimal floorMarginPercent;
    /** Hạn xử lý phê duyệt (createdAt + SLA) — chỉ populate cho API Giám đốc duyệt đơn. */
    private LocalDate approvalSlaDueAt;
}
