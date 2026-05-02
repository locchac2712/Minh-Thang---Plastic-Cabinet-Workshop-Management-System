package com.tuplastic.erp.common.dto.chart;

import com.tuplastic.erp.common.exception.BadRequestException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Helper dùng chung cho mọi chart service: chuẩn hóa kỳ thời gian, granularity mặc định, ép kiểu kết quả native query.
 */
public final class ChartUtils {

    private ChartUtils() {
    }

    public static class Period {
        public final LocalDate from;
        public final LocalDate to;
        public final ChartGranularity granularity;

        public Period(LocalDate from, LocalDate to, ChartGranularity granularity) {
            this.from = from;
            this.to = to;
            this.granularity = granularity;
        }
    }

    /**
     * Chuẩn hóa: thiếu cả hai date thì lấy 30 ngày tới hôm nay; thiếu một thì bù.
     * Nếu granularity null: <= 60 ngày → DAY, &lt;= 365 ngày → WEEK, ngược lại → MONTH.
     */
    public static Period normalize(LocalDate fromDate, LocalDate toDate, ChartGranularity gran) {
        LocalDate today = LocalDate.now();
        LocalDate to = toDate != null ? toDate : today;
        LocalDate from = fromDate != null ? fromDate : to.minusDays(29);
        if (from.isAfter(to)) {
            throw new BadRequestException("from_date không được sau to_date.");
        }
        if (gran == null) {
            long days = ChronoUnit.DAYS.between(from, to) + 1;
            if (days <= 60) {
                gran = ChartGranularity.DAY;
            } else if (days <= 365) {
                gran = ChartGranularity.WEEK;
            } else {
                gran = ChartGranularity.MONTH;
            }
        }
        return new Period(from, to, gran);
    }

    public static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        return new BigDecimal(value.toString());
    }

    public static long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number n) {
            return n.longValue();
        }
        return Long.parseLong(value.toString());
    }

    public static UUID toUuid(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof UUID u) {
            return u;
        }
        return UUID.fromString(value.toString());
    }

    public static LocalDate toLocalDate(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDate ld) {
            return ld;
        }
        if (value instanceof java.sql.Date d) {
            return d.toLocalDate();
        }
        if (value instanceof java.sql.Timestamp ts) {
            return ts.toLocalDateTime().toLocalDate();
        }
        return LocalDate.parse(value.toString().substring(0, 10));
    }
}
