package com.pcwms.backend.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class BomUpdateRequest {
    private String version;
    private boolean isActive;

    private List<BomDetailRequest> details;

    public Boolean getIsActive() {
        return isActive;
    }
}

