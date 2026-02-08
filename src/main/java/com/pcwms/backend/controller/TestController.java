package com.pcwms.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/test")
public class TestController {

    // 1. Ai cũng vào được (Không cần đăng nhập)
    @GetMapping("/all")
    public String allAccess() {
        return "Public Content: Ai cũng xem được.";
    }

    // 2. Phải đăng nhập, và có quyền USER hoặc STAFF hoặc ADMIN
    @GetMapping("/user")
    @PreAuthorize("hasAuthority('USER') or hasAuthority('STAFF') or hasAuthority('ADMIN')")
    public String userAccess() {
        return "User Content: Đây là nội dung cho User/Staff.";
    }

    // 3. Chỉ ADMIN mới vào được
    @GetMapping("/admin")
    @PreAuthorize("hasAuthority('ADMIN')")
    public String adminAccess() {
        return "Admin Board: Xin chào Sếp! Chỉ ADMIN mới thấy dòng này.";
    }
}