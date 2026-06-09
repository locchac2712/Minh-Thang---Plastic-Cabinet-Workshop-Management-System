package com.tuplastic.erp.agency.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SellerUpdateAgencyRequest {

    @Size(max = 255, message = "Tên đại lý không được vượt quá 255 ký tự")
    private String name;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String phone;

    @Email(message = "Email không hợp lệ")
    @Size(max = 255, message = "Email không được vượt quá 255 ký tự")
    private String email;

    private String address;

    @Size(max = 50, message = "Mã số thuế không được vượt quá 50 ký tự")
    private String taxCode;

    @Size(max = 500, message = "Tên pháp nhân không được vượt quá 500 ký tự")
    private String legalCompanyName;
}
