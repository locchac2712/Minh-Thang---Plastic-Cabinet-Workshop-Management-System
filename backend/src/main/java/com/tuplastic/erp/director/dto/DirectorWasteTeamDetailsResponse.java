package com.tuplastic.erp.director.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectorWasteTeamDetailsResponse {

    private UUID teamUserId;
    private String picName;
    private String teamLabel;
    private String areaLabel;
    private LocalDateTime latestEventAt;
    private String topMaterialCode;
    private String topMaterialName;
    /** MVP: chưa có quy đổi diện tích trong master data */
    private BigDecimal equivalentAreaSqm;
    private List<DirectorWasteMaterialRow> materialRows;
    private String remark;
}
