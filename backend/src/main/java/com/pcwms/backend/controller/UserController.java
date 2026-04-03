package com.pcwms.backend.controller; // Nhớ đổi đúng package của bạn

import com.pcwms.backend.dto.request.ChangePasswordRequest;
import com.pcwms.backend.dto.request.UpdateProfileRequest;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.dto.response.UserProfileResponse;
import com.pcwms.backend.dto.response.UserResponseDTO;
import com.pcwms.backend.entity.Role;
import com.pcwms.backend.entity.User;
import com.pcwms.backend.repository.RoleRepository;
import com.pcwms.backend.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private RoleRepository roleRepository;

    // 1. API GỬI DATA CHO FRONTEND HIỂN THỊ LÊN FORM (GET)
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()") // Bất kỳ ai đã đăng nhập đều có thể xem thông tin cá nhân của mình
    public ResponseEntity<?> getProfile(Principal principal) {
        try {
            UserProfileResponse profile = userService.getMyProfile(principal.getName());
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 2. API NHẬN DATA TỪ FRONTEND ĐỂ LƯU XUỐNG DB (PUT)
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest request, Principal principal) {
        try {
            userService.updateMyProfile(principal.getName(), request);
            return ResponseEntity.ok(new ResponseObject("SUCCESS", "Cập nhật thông tin hồ sơ thành công.", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseObject("ERROR", e.getMessage(), null));
        }
    }

    // 3. API ĐỔI MẬT KHẨU
    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request, Principal principal) {
        try {
            userService.changePassword(principal.getName(), request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok(new ResponseObject("SUCCESS", "Mật khẩu đã được thay đổi thành công..", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseObject("ERROR", e.getMessage(), null));
        }
    }

    // Lay tat ca nguoi dung
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<UserResponseDTO> users = userService.getAllUsers()
                    .stream()
                    .map(UserResponseDTO::fromEntity)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }

    // Lay tat ca roles
    @GetMapping("/roles")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<?> getAllRoles() {
        try {
            List<Role> roles = roleRepository.findAll();
            return ResponseEntity.ok(roles);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }

    // tao nguoi dung/staff
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<?> createUser(@RequestBody User user) {
        try {
            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Thêm user thành công", userService.createUser(user))
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User user) {
        try {
            return ResponseEntity.ok(
                    new ResponseObject("SUCCESS", "Cập nhật user thành công", userService.updateUser(id, user))
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject("ERROR", e.getMessage(), null)
            );
        }
    }

    // xoa nguoi dung/staff
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Xóa user thành công", null)
        );
    }

    // khoa tai khoan nguoi dung/staff
    @PutMapping("/{id}/lock")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<UserResponseDTO> lockUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.lockUser(id));
    }

    // mo khoa tai khoan nguoi dung/staff
    @PutMapping("/{id}/unlock")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<UserResponseDTO> unlockUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.unlockUser(id));
    }
}