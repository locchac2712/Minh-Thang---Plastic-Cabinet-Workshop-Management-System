package com.pcwms.backend.controller; // Nhớ đổi đúng package của bạn

import com.pcwms.backend.dto.request.UpdateProfileRequest;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.dto.response.UserProfileResponse;
import com.pcwms.backend.dto.response.UserResponseDTO;
import com.pcwms.backend.entity.User;
import com.pcwms.backend.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/user")
public class UserController {

    @Autowired
    private UserService userService;

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
            return ResponseEntity.ok("Cập nhật thông tin cá nhân thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // lay danh sach nguoi dung
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Danh sách người dùng", userService.getAllUsers()));
    }

    // lay chi tiet nguoi dung
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Chi tiết người dùng", UserResponseDTO.fromEntity(user)));
    }

    // tao nguoi dung/staff
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<?> createUser(@RequestBody com.pcwms.backend.dto.request.UserCreateRequest request) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Thêm user thành công", userService.createUser(request)));
    }

    // cap nhat thong tin nguoi dung/staff
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody com.pcwms.backend.dto.request.UserCreateRequest request, Principal principal) {
        try {
            return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Cập nhật user thành công", userService.updateUser(id, request, principal.getName())));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseObject("ERROR", e.getMessage(), null));
        }
    }

    // xoa nguoi dung/staff
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Xóa user thành công", null));
    }

    @PutMapping("/{id}/lock")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<?> lockUser(@PathVariable Long id, Principal principal) {
        try {
            return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Khóa tài khoản thành công", userService.lockUser(id, principal.getName())));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseObject("ERROR", e.getMessage(), null));
        }
    }

    // reset mat khau nguoi dung (Dùng đường dẫn tường minh hơn để tránh 404)
    @PutMapping("/reset-password-for-user/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<?> resetPassword(@PathVariable Long id) {
        try {
            String newPassword = userService.resetPassword(id);
            return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Đặt lại mật khẩu thành công", newPassword));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseObject("ERROR", e.getMessage(), null));
        }
    }

    // mo khoa tai khoan nguoi dung/staff
    @PutMapping("/{id}/unlock")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTOR')")
    public ResponseEntity<UserResponseDTO> unlockUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.unlockUser(id));
    }
}