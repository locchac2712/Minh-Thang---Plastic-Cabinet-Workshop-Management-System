package com.tuplastic.erp.security.controller;

import com.tuplastic.erp.common.dto.ApiResponse;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.user.dto.ChangeMePasswordRequest;
import com.tuplastic.erp.user.dto.UpdateMeRequest;
import com.tuplastic.erp.user.dto.UserResponse;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.mapper.UserMapper;
import com.tuplastic.erp.user.service.MeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MeController {

    private final SecurityUtils securityUtils;
    private final UserMapper userMapper;
    private final MeService meService;

    @GetMapping("/me")
    public ApiResponse<UserResponse> me() {
        User user = securityUtils.getCurrentUser();
        return ApiResponse.ok(userMapper.toResponse(user), "Thành công");
    }

    @PatchMapping("/me")
    public ApiResponse<UserResponse> updateMe(@Valid @RequestBody UpdateMeRequest request) {
        User user = securityUtils.getCurrentUser();
        UserResponse updated = meService.updateProfile(user, request);
        return ApiResponse.ok(updated, "Cập nhật hồ sơ thành công");
    }

    @PatchMapping("/me/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangeMePasswordRequest request) {
        User user = securityUtils.getCurrentUser();
        meService.changePassword(user, request);
        return ApiResponse.ok(null, "Đổi mật khẩu thành công");
    }
}
