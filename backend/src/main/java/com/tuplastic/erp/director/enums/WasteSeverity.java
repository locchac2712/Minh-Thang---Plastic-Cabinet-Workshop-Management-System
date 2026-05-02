package com.tuplastic.erp.director.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Mức độ hao phí theo ngưỡng (ước tính thiệt hại VND + số sự kiện).
 */
public enum WasteSeverity {
    CRITICAL,
    HIGH,
    WATCH,
    OK;

    @JsonCreator
    public static WasteSeverity fromString(String v) {
        if (v == null || v.isBlank()) {
            return null;
        }
        return WasteSeverity.valueOf(v.trim().toUpperCase());
    }

    @JsonValue
    public String toJson() {
        return name();
    }
}
