package com.pcwms.backend.dto.response;

import com.pcwms.backend.entity.BillOfMaterial;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BomResponse {
    private Long id;
    private String version; // 👉 Mới bổ sung để FE hiển thị Version 1.0, 2.0...
    private Long productId;
    private String productName;
    private String productSku;
    private Boolean isApproved;
    private Boolean isActive;

    public BomResponse(BillOfMaterial bom) {
        this.id = bom.getId();
        this.version = bom.getVersion();

        // Móc thông tin từ bảng Thành phẩm (Product) sang
        if (bom.getProduct() != null) {
            this.productId = bom.getProduct().getId();
            this.productName = bom.getProduct().getName();
            this.productSku = bom.getProduct().getSku();
        }
        this.isApproved = bom.getIsApproved();
        this.isActive = bom.getIsActive();
    }
}
