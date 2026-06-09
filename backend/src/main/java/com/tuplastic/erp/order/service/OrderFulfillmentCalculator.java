package com.tuplastic.erp.order.service;

import com.tuplastic.erp.order.entity.OrderItem;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class OrderFulfillmentCalculator {

    private final ProductionTaskRepository productionTaskRepository;

    @Data
    @Builder
    public static class Rollup {
        private int orderedQty;
        private int batchedQty;
        private int deliveredQty;
        private int remainingToBatch;
        private int remainingToDeliver;

        public boolean isFulfillmentComplete() {
            return orderedQty > 0 && deliveredQty >= orderedQty;
        }
    }

    public Rollup rollupForItems(List<OrderItem> items) {
        int ordered = 0;
        int batched = 0;
        int delivered = 0;
        for (OrderItem item : items) {
            int qty = item.getQuantity() != null ? item.getQuantity() : 0;
            int batchedItem = productionTaskRepository.sumQuantityByOrderItemId(item.getId());
            int deliveredItem = item.getDeliveredQuantity() != null ? item.getDeliveredQuantity() : 0;
            ordered += qty;
            batched += batchedItem;
            delivered += deliveredItem;
        }
        return Rollup.builder()
                .orderedQty(ordered)
                .batchedQty(batched)
                .deliveredQty(delivered)
                .remainingToBatch(Math.max(0, ordered - batched))
                .remainingToDeliver(Math.max(0, ordered - delivered))
                .build();
    }
}
