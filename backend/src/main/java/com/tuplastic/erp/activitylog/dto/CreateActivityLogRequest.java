package com.tuplastic.erp.activitylog.dto;

import lombok.Data;

@Data
public class CreateActivityLogRequest {

    private String imageUrl;
    private String description;
}
