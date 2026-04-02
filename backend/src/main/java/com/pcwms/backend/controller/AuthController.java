package com.pcwms.backend.controller;

import com.pcwms.backend.dto.request.ForgotPasswordRequest;
import com.pcwms.backend.dto.request.LoginRequest;
import com.pcwms.backend.dto.request.ResetPasswordRequest;
import com.pcwms.backend.dto.request.SignupRequest;
import com.pcwms.backend.dto.response.JwtResponse;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.entity.Role;
import com.pcwms.backend.entity.User;
import com.pcwms.backend.repository.RoleRepository;
import com.pcwms.backend.repository.UserRepository;
import com.pcwms.backend.security.services.AuthService;
import com.pcwms.backend.security.services.UserDetailsImpl;
import com.pcwms.backend.util.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    AuthService authService;
    @PostMapping("/login")
    public ResponseEntity<ResponseObject> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            // 1. Xác thực Username và Password
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            // 2. Nếu thành công, set thông tin vào Security Context
            SecurityContextHolder.getContext().setAuthentication(authentication);

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String jwt = jwtUtils.generateJwtToken(userDetails.getUsername());
            String role = userDetails.getAuthorities().iterator().next().getAuthority();

            JwtResponse jwtResponse = new JwtResponse(jwt, userDetails.getId(), userDetails.getUsername(), role);

            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Đăng nhập thành công!", jwtResponse)
            );
        } catch (DisabledException e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", null)
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", "Tên đăng nhập hoặc mật khẩu không chính xác.", null)
            );
        } catch (AuthenticationException e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", "Lỗi xác thực: " + e.getMessage(), null)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", "Có lỗi xảy ra: " + e.getMessage(), null)
            );
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ResponseObject> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            String message = authService.forgotPassword(request.getEmail());
            // Trả về JSON chuẩn chỉ
            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", message, null)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }

    // ==========================================
    // API Đặt Lại Mật Khẩu (Xác nhận OTP)
    // ==========================================
    @PostMapping("/reset-password")
    public ResponseEntity<ResponseObject> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            // Đã đổi thành request.getOtp()
            authService.resetPassword(request.getOtp(), request.getNewPassword());

            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Mật khẩu của bạn đã được thay đổi thành công!", null)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }
}