package com.pcwms.backend.controller; // Nhớ đổi đúng package của bạn

import com.pcwms.backend.dto.request.UpdateProfileRequest;
import com.pcwms.backend.dto.response.ResponseObject;
import com.pcwms.backend.dto.response.UserProfileResponse;
import com.pcwms.backend.entity.User;
import com.pcwms.backend.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/user")
public class UserController {

    @Autowired
    private UserService userService;

    // 1. API GỬI DATA CHO FRONTEND HIỂN THỊ LÊN FORM (GET)
    @GetMapping("/profile")
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
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest request, Principal principal) {
        try {
            userService.updateMyProfile(principal.getName(), request);
            return ResponseEntity.ok("Cập nhật thông tin cá nhân thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Thêm user thành công", userService.createUser(user))
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User user) {
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Cập nhật user thành công", userService.updateUser(id, user))
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(
                new ResponseObject("SUCCESS", "Xóa user thành công", null)
        );
    }
}