package com.tuplastic.erp.production.util;

import com.tuplastic.erp.production.repository.ProductionTaskRepository;

import java.time.Year;
import java.time.ZoneId;
import java.util.UUID;
import java.util.regex.Pattern;

public final class ProductionTaskDisplayCodeUtils {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Pattern DISPLAY_CODE = Pattern.compile("^LSX-\\d{4}-\\d{5}$");
    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
            Pattern.CASE_INSENSITIVE);

    private ProductionTaskDisplayCodeUtils() {
    }

    public static String allocateDisplayCode(ProductionTaskRepository taskRepository) {
        long seq = taskRepository.nextProductionTaskNumberSeq();
        int year = Year.now(BUSINESS_ZONE).getValue();
        return String.format("LSX-%d-%05d", year, seq);
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
}
