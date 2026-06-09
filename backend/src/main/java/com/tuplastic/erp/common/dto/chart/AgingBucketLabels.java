package com.tuplastic.erp.common.dto.chart;

/**
 * Nhãn hiển thị bucket aging (Accountant charts).
 */
public final class AgingBucketLabels {

    public static final String DAYS_0_30 = "0-30";
    public static final String DAYS_31_60 = "31-60";
    public static final String DAYS_61_90 = "61-90";
    public static final String DAYS_OVER_90 = ">90";

    private AgingBucketLabels() {
    }

    public static String toVietnamese(String bucketKey) {
        if (bucketKey == null) {
            return null;
        }
        return switch (bucketKey) {
            case DAYS_0_30 -> "0–30 ngày";
            case DAYS_31_60 -> "31–60 ngày";
            case DAYS_61_90 -> "61–90 ngày";
            case DAYS_OVER_90 -> "Trên 90 ngày";
            default -> bucketKey;
        };
    }
}
