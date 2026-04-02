package com.pcwms.backend.dto.response;

import com.pcwms.backend.entity.SalesOrder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class SalesOrderListResponse {
    private Long id;
    private String orderNumber;
    private String customerName;
    private BigDecimal totalAmount;
    private String status;        // Trạng thái đơn (PENDING, PROCESSING, DELIVERED, CANCELLED)
    private String paymentStatus; // Trạng thái thanh toán (UNPAID, PARTIAL, PAID)
    private LocalDateTime createdDate;
    private boolean hasManufactureOrder;

    // Constructor Map trực tiếp từ Entity sang DTO
    public SalesOrderListResponse(SalesOrder order) {
        this.id = order.getId();
        this.orderNumber = order.getOrderNumber();
        this.customerName = order.getCustomer().getName();
        this.totalAmount = order.getTotalAmount();
        this.status = order.getStatus();
        this.paymentStatus = order.getPaymentStatus();
        this.createdDate = order.getCreatedDate();
        this.hasManufactureOrder = order.getManufactureOrders() != null && !order.getManufactureOrders().isEmpty();
    }
}