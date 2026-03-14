package com.pcwms.backend.dto.request;

import lombok.Data;

@Data
public class UserCreateRequest {
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private String role;
    private String password;
}
