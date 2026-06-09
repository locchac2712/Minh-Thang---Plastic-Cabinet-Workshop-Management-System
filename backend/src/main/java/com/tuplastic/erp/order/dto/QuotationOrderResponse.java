package com.tuplastic.erp.order.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Giống {@link OrderResponse} nhưng thêm {@link #quotationStatus} — gộp vòng đời thực tế
 * thành 5 ô báo giá: Draft, Pending, Approved (đã chốt và các bước sau), Rejected, Canceled.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class QuotationOrderResponse extends OrderResponse {

    /**
     * Luôn là một trong: {@code Draft}, {@code Pending}, {@code Approved}, {@code Rejected}, {@code Canceled}.
     * Trường {@link OrderResponse#getStatus()} vẫn là trạng thái đơn gốc (Approved, Producing, …).
     */
    private String quotationStatus;
}
