package com.tuplastic.erp.common.dto.chart;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class AgingBucketLabelsTest {

    @Test
    void toVietnamese_mapsKnownBuckets() {
        assertEquals("0–30 ngày", AgingBucketLabels.toVietnamese("0-30"));
        assertEquals("31–60 ngày", AgingBucketLabels.toVietnamese("31-60"));
        assertEquals("61–90 ngày", AgingBucketLabels.toVietnamese("61-90"));
        assertEquals("Trên 90 ngày", AgingBucketLabels.toVietnamese(">90"));
    }

    @Test
    void toVietnamese_nullOrUnknownPassthrough() {
        assertNull(AgingBucketLabels.toVietnamese(null));
        assertEquals("custom", AgingBucketLabels.toVietnamese("custom"));
    }
}
