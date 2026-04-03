package com.pcwms.backend.dto.response;

import com.pcwms.backend.entity.ManufactureOrder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class MOCalendarResponse {
    private Long id;
    private String moNumber;
    private String orderNumber;
    private String customerName;
    private String productName;
    private Integer quantity;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;

    public MOCalendarResponse(ManufactureOrder mo) {
        this.id = mo.getId();
        this.moNumber = mo.getMoNumber();
        this.orderNumber = mo.getSalesOrder().getOrderNumber();
        this.customerName = mo.getSalesOrder().getCustomer() != null 
                ? mo.getSalesOrder().getCustomer().getName() 
                : "Khách lẻ";
        this.productName = mo.getProduct().getName();
        this.quantity = mo.getQuantity();
        this.startDate = mo.getStartDate();
        this.endDate = mo.getEndDate();
        this.status = mo.getStatus();
    }
}