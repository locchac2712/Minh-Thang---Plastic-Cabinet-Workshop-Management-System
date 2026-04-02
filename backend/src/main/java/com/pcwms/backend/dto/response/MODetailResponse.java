package com.pcwms.backend.dto.response;

import com.pcwms.backend.entity.ManufactureOrder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class MODetailResponse {
    private Long id;
    private String moNumber;
    private String orderNumber; // Mã đơn hàng (SO)
    private String productName;
    private Integer quantity;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String technicalNotes;

    public MODetailResponse(ManufactureOrder mo) {
        this.id = mo.getId();
        this.moNumber = mo.getMoNumber();
        this.orderNumber = mo.getSalesOrder().getOrderNumber();
        this.productName = mo.getProduct().getName();
        this.quantity = mo.getQuantity();
        this.status = mo.getStatus();
        this.startDate = mo.getStartDate();
        this.endDate = mo.getEndDate();
        this.technicalNotes = mo.getTechnicalNotes();
    }
}