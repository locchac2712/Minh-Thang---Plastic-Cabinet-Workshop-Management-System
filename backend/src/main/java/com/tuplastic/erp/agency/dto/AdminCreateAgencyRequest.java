package com.tuplastic.erp.agency.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class AdminCreateAgencyRequest {

    @NotNull(message = "Mã nhân viên kinh doanh phụ trách không được để trống")
    private UUID assignedSellerId;

    @NotBlank(message = "Tên đại lý không được để trống")
    @Size(max = 255, message = "Tên đại lý không được vượt quá 255 ký tự")
    private String name;

    @NotBlank(message = "Cấp đại lý không được để trống")
    @Size(max = 50, message = "Cấp đại lý không được vượt quá 50 ký tự")
    private String level;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String phone;

    private String address;

    @Size(max = 50, message = "Mã số thuế không được vượt quá 50 ký tự")
    private String taxCode;
}
