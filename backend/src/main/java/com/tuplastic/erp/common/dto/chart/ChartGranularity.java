package com.tuplastic.erp.common.dto.chart;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Bucket dùng cho các chart trend; map sang {@code date_trunc('day'|'week'|'month', ...)} trong Postgres.
 */
public enum ChartGranularity {
    DAY("day"),
    WEEK("week"),
    MONTH("month");

    private final String pgUnit;

    ChartGranularity(String pgUnit) {
        this.pgUnit = pgUnit;
    }

    public String getPgUnit() {
        return pgUnit;
    }

    public String getInterval() {
        return "1 " + pgUnit;
    }

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ChartGranularity fromString(String v) {
        if (v == null || v.isBlank()) {
            return null;
        }
        return ChartGranularity.valueOf(v.trim().toUpperCase());
    }
}
