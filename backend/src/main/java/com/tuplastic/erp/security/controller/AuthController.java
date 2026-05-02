package com.tuplastic.erp.security.controller;

import com.tuplastic.erp.common.dto.ApiResponse;
import com.tuplastic.erp.security.dto.AuthResetPasswordRequest;
import com.tuplastic.erp.security.dto.ForgotPasswordRequest;
import com.tuplastic.erp.security.dto.LoginRequest;
import com.tuplastic.erp.security.dto.LoginResponse;
import com.tuplastic.erp.security.jwt.JwtTokenProvider;
import com.tuplastic.erp.security.service.PasswordResetService;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordResetService passwordResetService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng"));

        LoginResponse loginResponse = LoginResponse.builder()
                .accessToken(jwt)
                .tokenType("Bearer")
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .build();

        return ApiResponse.ok(loginResponse, "Đăng nhập thành công");
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestResetByEmail(request.getEmail());
        return ApiResponse.ok(null, PasswordResetService.FORGOT_PASSWORD_PUBLIC_MESSAGE);
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPasswordPublic(@Valid @RequestBody AuthResetPasswordRequest request) {
        passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
        return ApiResponse.ok(null, "Đặt lại mật khẩu thành công.");
    }
}
