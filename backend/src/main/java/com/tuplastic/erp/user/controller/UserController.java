package com.tuplastic.erp.user.controller;

import com.tuplastic.erp.common.dto.ApiResponse;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.user.dto.CreateUserRequest;
import com.tuplastic.erp.user.dto.ResetPasswordRequest;
import com.tuplastic.erp.user.dto.UpdateUserRequest;
import com.tuplastic.erp.user.dto.UserResponse;
import com.tuplastic.erp.user.enums.UserRole;
import com.tuplastic.erp.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR')")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public PageResponse<UserResponse> getAllUsers(
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Boolean status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return userService.getAllUsers(role, status, page, size);
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable UUID id) {
        return userService.getUserById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@Valid @RequestBody CreateUserRequest request) {
        return userService.createUser(request);
    }

    @PutMapping("/{id}")
    public UserResponse updateUser(@PathVariable UUID id,
                                   @Valid @RequestBody UpdateUserRequest request) {
        return userService.updateUser(id, request);
    }

    @PatchMapping("/{id}/password")
    public ApiResponse<Void> resetPassword(@PathVariable UUID id,
                                           @Valid @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(id, request);
        return ApiResponse.ok(null, "Đặt lại mật khẩu thành công");
    }

    @PatchMapping("/{id}/toggle-active")
    public UserResponse toggleActive(@PathVariable UUID id) {
        return userService.toggleActive(id);
    }
}
