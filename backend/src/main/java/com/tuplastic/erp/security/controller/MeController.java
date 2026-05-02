package com.tuplastic.erp.security.controller;

import com.tuplastic.erp.common.dto.ApiResponse;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.user.dto.UserResponse;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MeController {

    private final SecurityUtils securityUtils;
    private final UserMapper userMapper;

    @GetMapping("/me")
    public ApiResponse<UserResponse> me() {
        User user = securityUtils.getCurrentUser();
        return ApiResponse.ok(userMapper.toResponse(user), "Thành công");
    }
}
