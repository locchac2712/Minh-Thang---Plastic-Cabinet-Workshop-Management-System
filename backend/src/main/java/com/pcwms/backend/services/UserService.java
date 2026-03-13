package com.pcwms.backend.services;

import com.pcwms.backend.dto.request.UpdateProfileRequest;
import com.pcwms.backend.dto.response.UserProfileResponse;
import com.pcwms.backend.dto.response.UserResponseDTO;
import com.pcwms.backend.entity.Staff;
import com.pcwms.backend.entity.User;
import com.pcwms.backend.repository.StaffRepository;
import com.pcwms.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StaffRepository staffRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    // ===============================================
    // 1. HÀM LẤY THÔNG TIN ĐỂ HIỂN THỊ LÊN FORM
    // ===============================================
    public UserProfileResponse getMyProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy tài khoản!"));
        Staff staff = staffRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy hồ sơ nhân viên!"));

        return new UserProfileResponse(
                user.getUsername(),
                user.getEmail(),
                staff.getFullname(),
                staff.getPhoneNumber(),
                staff.getDepartment()
        );
    }

    // ===============================================
    // 2. HÀM LƯU THÔNG TIN CHỈNH SỬA XUỐNG DB
    // ===============================================
    @Transactional
    public void updateMyProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy tài khoản!"));
        Staff staff = staffRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy hồ sơ nhân viên!"));

        // Cập nhật Email (Bảng User)
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            user.setEmail(request.getEmail());
            userRepository.save(user);
        }

        // Cập nhật Họ Tên và Số điện thoại (Bảng Staff)
        if (request.getFullname() != null && !request.getFullname().trim().isEmpty()) {
            staff.setFullname(request.getFullname());
        }
        if (request.getPhoneNumber() != null) {
            staff.setPhoneNumber(request.getPhoneNumber());
        }
        staffRepository.save(staff);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + id));
    }

    private static final String DEFAULT_PASSWORD = "Pizama123";

    private void validatePassword(String password) {
        if (password == null || password.length() < 8) {
            throw new RuntimeException("Mật khẩu phải có ít nhất 8 ký tự!");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new RuntimeException("Mật khẩu phải có ít nhất 1 chữ hoa!");
        }
        if (!password.matches(".*[0-9].*")) {
            throw new RuntimeException("Mật khẩu phải có ít nhất 1 chữ số!");
        }
    }

    public User createUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Tai khoản đã tồn tại. Vui lòng chọn một tên đăng nhập khác.");
        }
        // Nếu không truyền password thì dùng default, ngược lại validate rồi encode
        String rawPassword = (user.getPassword() == null || user.getPassword().trim().isEmpty())
                ? DEFAULT_PASSWORD
                : user.getPassword();

        validatePassword(rawPassword);
        user.setPassword(passwordEncoder.encode(rawPassword));

        return userRepository.save(user);
    }

    public User updateUser(Long id, User userDetails) {
        if (!userRepository.existsByUsername(userDetails.getUsername())) {
            throw new RuntimeException("Không tìm thấy người dùng với tên đăng nhập: " + userDetails.getUsername());
        }
        User existingUser = getUserById(id);
        existingUser.setUsername(userDetails.getUsername());
        existingUser.setEmail(userDetails.getEmail());
        existingUser.setIsActive(userDetails.getIsActive());
        existingUser.setRole(userDetails.getRole());

        // Nếu có truyền password mới thì validate + encode, ngược lại giữ nguyên
        if (userDetails.getPassword() != null && !userDetails.getPassword().trim().isEmpty()) {
            validatePassword(userDetails.getPassword());
            existingUser.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }

        return userRepository.save(existingUser);
    }

    public void deleteUser(Long id) {
        User user = getUserById(id);
        user.setIsActive(false);
        userRepository.delete(user);
    }


    public UserResponseDTO lockUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + id));
        if(!user.getIsActive()) {
            throw new RuntimeException("Tài khoản đã bị khóa trước đó.");
        }
        user.setIsActive(false);
        User save1 = userRepository.save(user);
        return UserResponseDTO.fromEntity(save1);
    }

    public UserResponseDTO unlockUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + id));
        if(user.getIsActive()) {
            throw new RuntimeException("Tài khoản đã được kích hoạt trước đó.");
        }
        user.setIsActive(true);
        User save1 = userRepository.save(user);
        return UserResponseDTO.fromEntity(save1);
    }
}