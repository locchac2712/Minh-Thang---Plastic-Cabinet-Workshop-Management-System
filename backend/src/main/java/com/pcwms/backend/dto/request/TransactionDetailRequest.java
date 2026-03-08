package com.pcwms.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TransactionDetailRequest {

    // 👉 BƠM THÊM: Dùng khi thủ kho xuất/nhập Thành phẩm (Bàn, Ghế...)
    @JsonProperty("productId")
    private Long productId;

    // 👉 ĐÃ SỬA: Viết thường chữ 'm' cho chuẩn Java (materialId)
    @JsonProperty("materialId")
    private Long materialId;

    @JsonProperty("quantity")
    private Integer quantity;

    public TransactionDetailRequest() {
    }

    // --- GETTER & SETTER CHO PRODUCT ---
    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    // --- GETTER & SETTER CHO MATERIAL ---
    public Long getMaterialId() {
        return materialId;
    }

    public void setMaterialId(Long materialId) {
        this.materialId = materialId;
    }

    // --- GETTER & SETTER CHO QUANTITY ---
    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}