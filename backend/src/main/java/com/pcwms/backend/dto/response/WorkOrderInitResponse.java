package com.pcwms.backend.dto.response;

import com.pcwms.backend.entity.ManufactureOrder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkOrderInitResponse {
    private Long planId;
    private String planNumber;
    private String salesOrderNumber;
    private String customerName;

    public WorkOrderInitResponse(ManufactureOrder mo){
        this.planId = mo.getId();
        this.planNumber = mo.getMoNumber();
        this.salesOrderNumber = mo.getSalesOrder().getOrderNumber();
        this.customerName = mo.getSalesOrder().getCustomer().getName();
    }
}
