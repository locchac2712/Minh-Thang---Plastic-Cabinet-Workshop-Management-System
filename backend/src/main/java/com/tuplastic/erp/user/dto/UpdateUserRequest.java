package com.tuplastic.erp.user.dto;

import com.tuplastic.erp.user.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @Email(message = "Email không đúng định dạng")
    private String email;

    @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
    private String fullName;

    private UserRole role;
}
