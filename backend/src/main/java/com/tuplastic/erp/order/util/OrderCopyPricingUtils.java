package com.tuplastic.erp.order.util;

import com.tuplastic.erp.order.dto.CreateOrderItemRequest;
import com.tuplastic.erp.order.dto.CreateOrderRequest;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.entity.OrderItem;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * So sánh payload tạo đơn fulfillment với báo giá/đơn nguồn — chỉ đơn giá dòng và tập SP;
 * chiết khấu thêm / phí giao có thể khác mà vẫn auto-duyệt.
 */
public final class OrderCopyPricingUtils {

    private OrderCopyPricingUtils() {
    }

    /**
     * @return true nếu đơn giá từng dòng khớp nguồn và request là tập con SP nguồn (SL được phép lệch).
     */
    public static boolean isPricingAlignedWithSource(Order source, CreateOrderRequest request) {
        if (source == null || request == null) {
            return false;
        }

        Map<UUID, BigDecimal> sourceUnitPrices = sourceUnitPricesByProductId(source.getItems());
        if (sourceUnitPrices.isEmpty()) {
            return false;
        }

        List<CreateOrderItemRequest> requestItems = request.getItems();
        if (requestItems == null || requestItems.isEmpty()) {
            return false;
        }

        for (CreateOrderItemRequest itemReq : requestItems) {
            UUID productId = itemReq.getProductId();
            if (productId == null) {
                return false;
            }
            BigDecimal sourcePrice = sourceUnitPrices.get(productId);
            if (sourcePrice == null) {
                return false;
            }
            if (itemReq.getUnitPrice() == null || sourcePrice.compareTo(itemReq.getUnitPrice()) != 0) {
                return false;
            }
        }

        return true;
    }

    private static Map<UUID, BigDecimal> sourceUnitPricesByProductId(List<OrderItem> items) {
        Map<UUID, BigDecimal> map = new HashMap<>();
        if (items == null) {
            return map;
        }
        for (OrderItem item : items) {
            if (item.getProduct() == null || item.getProduct().getId() == null) {
                continue;
            }
            map.put(item.getProduct().getId(), item.getUnitPrice());
        }
        return map;
    }
}
