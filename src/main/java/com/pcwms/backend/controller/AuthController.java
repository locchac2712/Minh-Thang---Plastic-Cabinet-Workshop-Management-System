package com.pcwms.backend.controller;

import com.pcwms.backend.dto.request.LoginRequest;
import com.pcwms.backend.dto.request.SignupRequest;
import com.pcwms.backend.dto.response.JwtResponse;
import com.pcwms.backend.entity.Role;
import com.pcwms.backend.entity.User;
import com.pcwms.backend.repository.RoleRepository;
import com.pcwms.backend.repository.UserRepository;
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

    // API Đăng nhập
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {

        // 1. Xác thực username và password
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        // 2. Nếu đúng, lưu thông tin vào Context
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 3. Sinh token JWT
        String jwt = jwtUtils.generateJwtToken(authentication.getName());

        // 4. Lấy thông tin user để trả về
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String role = userDetails.getAuthorities().stream()
                .findFirst().get().getAuthority();

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getUsername(),
                role));
    }

    // API Đăng ký
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        // 1. Check trùng username
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body("Error: Username is already taken!");
        }

        // 2. Tìm Role trong DB (Nếu không thấy thì báo lỗi)
        Role role = roleRepository.findByRoleName(signUpRequest.getRole())
                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));

        // 3. Tạo User mới
        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setPassword(encoder.encode(signUpRequest.getPassword())); // Nhớ mã hóa pass
        user.setRole(role);
        user.setIsActive(true);

        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully!");
    }
}