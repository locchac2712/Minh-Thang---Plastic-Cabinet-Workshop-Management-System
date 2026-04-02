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
    private String productName;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;

    public MOCalendarResponse(ManufactureOrder mo) {
        this.id = mo.getId();
        this.moNumber = mo.getMoNumber();
        this.productName = mo.getProduct().getName(); // Giả sử Product có trường name
        this.startDate = mo.getStartDate();
        this.endDate = mo.getEndDate();
        this.status = mo.getWipStatus();
    }
}