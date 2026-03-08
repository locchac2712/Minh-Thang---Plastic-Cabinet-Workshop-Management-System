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

    // API Đăng nhập
    @PostMapping("/login")
    public ResponseEntity<ResponseObject> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            // 1. Xác thực Username và Password
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            // 2. Nếu thành công, set thông tin vào Security Context
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 3. ĐẢO LÊN TRƯỚC: Lấy thông tin User (UserDetails) ra khỏi Authentication
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            // 4. SỬA Ở ĐÂY: Truyền username (String) vào hàm thay vì truyền cục authentication
            String jwt = jwtUtils.generateJwtToken(userDetails.getUsername());

            // 5. Lấy role (vì dự án của mình mỗi người 1 role nên lấy cái đầu tiên)
            String role = userDetails.getAuthorities().iterator().next().getAuthority();

            // 6. Đóng gói dữ liệu trả về
            JwtResponse jwtResponse = new JwtResponse(jwt, userDetails.getId(), userDetails.getUsername(), role);

            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Đăng nhập thành công!", jwtResponse)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", "Sai tên đăng nhập hoặc mật khẩu", null)
            );
        }
    }


    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            String message = authService.forgotPassword(request.getEmail());
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            // Nếu không tìm thấy email, ném lỗi 400 về cho React hiện thông báo đỏ
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok("Mật khẩu của bạn đã được thay đổi thành công!");
        } catch (Exception e) {
            // Nếu token sai hoặc hết hạn, báo lỗi
            return ResponseEntity.badRequest().body(e.getMessage());
        }

    }
}