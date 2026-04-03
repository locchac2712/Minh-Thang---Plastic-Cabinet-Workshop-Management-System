export const fmt = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "—";
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
