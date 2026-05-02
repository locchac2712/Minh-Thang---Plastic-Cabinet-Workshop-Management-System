package com.tuplastic.erp.order.dto;

import lombok.Data;

/** Director trả đơn cho seller chỉnh giá / bổ sung — optional lý do. */
@Data
public class RequestOrderRevisionRequest {

    private String note;
}
