package com.tuplastic.erp.supplier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateSupplierRequest {

    @NotBlank(message = "Tên nhà cung cấp không được để trống")
    @Size(max = 255, message = "Tên nhà cung cấp không được vượt quá 255 ký tự")
    private String name;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String phone;

    private String address;

    @Size(max = 50, message = "Mã số thuế không được vượt quá 50 ký tự")
    private String taxCode;
}
