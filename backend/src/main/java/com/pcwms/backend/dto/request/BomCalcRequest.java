package com.pcwms.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BomCalcRequest {
    private List<ProductQuantityItem> items;

    @Getter
    @Setter
    public static class ProductQuantityItem {
        private Long productId;
        private Integer quantity;
    }
}
