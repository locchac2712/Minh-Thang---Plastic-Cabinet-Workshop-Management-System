package com.tuplastic.erp.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Thống kê 3 trạng thái BOM theo sản phẩm (bảng điều khiển admin, chart donut). Chỉ tính
 * sản phẩm mẫu: {@code is_active = true} và {@code is_custom = false}.
 * <ul>
 *   <li>{@link #chuaCauHinhBomCount}: chưa có bản ghi nào trong {@code bom_items} cho SP đó.
 *   <li>{@link #thieuNvlTrongBomCount}: đã có BOM, nhưng tồn kho mã NVL bị ước tính thiếu so
 *   với định mức/1 sản phẩm ( {@code materials.stock_quantity &lt; bom_items.quantity} ) hoặc
 *   vật tư bị tắt ( {@code is_active = false} ).
 *   <li>{@link #duDinhMucCount}: đã có BOM, mọi dòng dùng vật tư active và
 *   {@code stock_quantity &gt;= quantity}.
 * </ul>
 * Ba số cộng lại bằng {@link #tongSoSanPham} (cùng phạm vi lọc).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductBomStatusByProductStatsResponse {

    private long chuaCauHinhBomCount;
    private long thieuNvlTrongBomCount;
    private long duDinhMucCount;
    private long tongSoSanPham;
}
