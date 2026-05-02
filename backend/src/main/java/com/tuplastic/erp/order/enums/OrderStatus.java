package com.tuplastic.erp.order.enums;

public enum OrderStatus {
    Draft,
    Pending,
    Approved,
    Producing,
    Done,
    /** Giám đốc từ chối phê duyệt (đơn đang Pending). */
    Rejected,
    /** Hủy đơn / kết thúc không thực hiện (luồng khác từ từ chối duyệt — dành cho mở rộng sau). */
    Canceled
}
