package com.tuplastic.erp.inventory.enums;

/**
 * Loại giao dịch kho (NVL & thành phẩm).
 * <p>
 * Mã lưu trong DB là tên hằng in hoa ({@link #name()} — {@code IMPORT}, {@code EXPORT},
 * {@code WASTE}); {@link #getLabel()} là nhãn tiếng Việt để hiển thị trên UI.
 * Đây là single source of truth cho việc map mã → nhãn, tránh literal rải rác.
 */
public enum TransactionType {

    IMPORT("Nhập kho"),
    EXPORT("Xuất kho"),
    WASTE("Hao phí");

    private final String label;

    TransactionType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    /**
     * Map mã giao dịch (vd {@code "EXPORT"}) sang nhãn tiếng Việt.
     *
     * @return {@code null} khi {@code code} null; nhãn tiếng Việt khi hợp lệ;
     *         trả nguyên {@code code} khi không nhận dạng được (an toàn cho dữ liệu cũ).
     */
    public static String labelOf(String code) {
        if (code == null) {
            return null;
        }
        try {
            return valueOf(code.trim().toUpperCase()).getLabel();
        } catch (IllegalArgumentException ex) {
            return code;
        }
    }
}
