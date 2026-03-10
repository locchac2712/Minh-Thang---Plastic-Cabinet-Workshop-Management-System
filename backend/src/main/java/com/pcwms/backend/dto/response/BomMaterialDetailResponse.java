package com.pcwms.backend.dto.response;

import com.pcwms.backend.entity.BillOfMaterialDetail;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BomMaterialDetailResponse {
    private Long id;
    private Long materialId;
    private String materialName;
    private String materialSku;
    private String unit;
    private BigDecimal quantityRequired;

    public BomMaterialDetailResponse(BillOfMaterialDetail detail) {
        this.id = detail.getId();
        this.quantityRequired = detail.getQuantityRequired();

        if (detail.getMaterial() != null) {
            this.materialId = detail.getMaterial().getId();
            this.materialName = detail.getMaterial().getName();
            this.materialSku = detail.getMaterial().getSku();
            this.unit = detail.getMaterial().getUnit();
        }
    }
}
