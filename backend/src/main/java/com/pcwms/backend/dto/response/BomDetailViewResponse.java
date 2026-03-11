package com.pcwms.backend.dto.response;

import com.pcwms.backend.entity.BillOfMaterial;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BomDetailViewResponse {
    private Long id;
    private String version;
    private Long productId;
    private String productName;
    private String productSku;
    private Boolean isApproved;
    private Boolean isActive;

    // 👉 ĐIỂM ĂN TIỀN LÀ ĐÂY: List chứa các vật tư con
    private List<BomMaterialDetailResponse> details;

    public BomDetailViewResponse(BillOfMaterial bom) {
        this.id = bom.getId();
        this.version = bom.getVersion();

        if (bom.getProduct() != null) {
            this.productId = bom.getProduct().getId();
            this.productName = bom.getProduct().getName();
            this.productSku = bom.getProduct().getSku();
        }
//        this.isApproved = bom.getIsApproved();
        this.isActive = bom.getIsActive();

        // Tự động quét list vật tư Entity và biến thành DTO
        if (bom.getBomDetails() != null) {
            this.details = bom.getBomDetails().stream()
                    .map(BomMaterialDetailResponse::new)
                    .collect(Collectors.toList());
        }
    }
}