package com.tuplastic.erp.order.util;

import com.tuplastic.erp.order.repository.OrderRepository;

import java.time.Year;
import java.time.ZoneId;
import java.util.UUID;
import java.util.regex.Pattern;

public final class OrderDisplayCodeUtils {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Pattern DISPLAY_CODE = Pattern.compile("^(BG|DH)-\\d{4}-\\d{5}$");
    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
            Pattern.CASE_INSENSITIVE);

    private OrderDisplayCodeUtils() {
    }

    public static String allocateDisplayCode(boolean quotation, OrderRepository orderRepository) {
        long seq = quotation
                ? orderRepository.nextQuotationNumberSeq()
                : orderRepository.nextOrderNumberSeq();
        int year = Year.now(BUSINESS_ZONE).getValue();
        String prefix = quotation ? "BG" : "DH";
        return String.format("%s-%d-%05d", prefix, year, seq);
    }

    public static boolean isUuid(String value) {
        return value != null && UUID_PATTERN.matcher(value.trim()).matches();
    }

    public static boolean looksLikeDisplayCode(String value) {
        return value != null && DISPLAY_CODE.matcher(value.trim()).matches();
    }

    public static UUID parseUuid(String value) {
        if (!isUuid(value)) {
            return null;
        }
        return UUID.fromString(value.trim());
    }

    public static String displayRef(String displayCode, UUID id) {
        if (displayCode != null && !displayCode.isBlank()) {
            return displayCode;
        }
        if (id == null) {
            return "—";
        }
        String s = id.toString();
        return s.length() >= 8 ? s.substring(0, 8) + "…" : s;
    }

    /** Mã đơn trên màn xưởng — chỉ DH (đơn thực hiện), không BG (báo giá mẫu). */
    public static String productionOrderDisplayCode(String displayCode) {
        if (displayCode == null || displayCode.isBlank()) {
            return null;
        }
        if (displayCode.startsWith("BG-")) {
            return null;
        }
        return displayCode;
    }
}
