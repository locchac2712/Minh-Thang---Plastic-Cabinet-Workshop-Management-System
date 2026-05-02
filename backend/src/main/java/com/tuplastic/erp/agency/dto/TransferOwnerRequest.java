package com.tuplastic.erp.agency.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class TransferOwnerRequest {

    @NotNull(message = "Mã nhân viên kinh doanh mới không được để trống")
    private UUID newSellerId;
}
