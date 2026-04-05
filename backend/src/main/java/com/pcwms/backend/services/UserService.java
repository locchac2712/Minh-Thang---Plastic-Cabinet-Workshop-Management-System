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
    /**
     * Lấy thông tin hồ sơ của người dùng hiện tại để hiển thị lên Form.
     * Đã cập nhật để lấy fullName (CamelCase) thay vì fullname.
     */
    public UserProfileResponse getMyProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy tài khoản!"));
        Staff staff = staffRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy hồ sơ nhân viên!"));

        return new UserProfileResponse(
                user.getUsername(),
                user.getEmail(),
                staff.getFullName(),
                staff.getPhoneNumber(),
                staff.getDepartment(),
                staff.getGender(),
                staff.getAddress()
        );
    }

    // ===============================================
    // 2. HÀM LƯU THÔNG TIN CHỈNH SỬA XUỐNG DB
    // ===============================================
    /**
     * Cập nhật thông tin hồ sơ cá nhân.
     * Cho phép thay đổi cả username và email (có kiểm tra tính duy nhất).
     * Mọi thay đổi sẽ được lưu log và cập nhật xuống Database ngay lập tức.
     */
    @Transactional
    public void updateMyProfile(String currentUsername, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy tài khoản!"));
        Staff staff = staffRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy hồ sơ nhân viên!"));

        boolean userChanged = false;

        // 1. Cập nhật Username (Nếu thay đổi)
        if (request.getUsername() != null && !request.getUsername().trim().isEmpty() 
            && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new RuntimeException("Tên đăng nhập '" + request.getUsername() + "' đã tồn tại.");
            }
            user.setUsername(request.getUsername());
            userChanged = true;
        }

        // 2. Cập nhật Email (Nếu thay đổi)
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty() 
            && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email '" + request.getEmail() + "' đã được sử dụng bởi tài khoản khác.");
            }
            user.setEmail(request.getEmail());
            userChanged = true;
        }

        if (userChanged) {
            userRepository.save(user);
        }

        // Cập nhật Họ Tên và Số điện thoại (Bảng Staff)
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            staff.setFullName(request.getFullName());
        }
        if (request.getPhoneNumber() != null) {
            staff.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getGender() != null) {
            staff.setGender(request.getGender());
        }
        if (request.getAddress() != null) {
            staff.setAddress(request.getAddress());
        }
        staffRepository.saveAndFlush(staff); // Sử dụng saveAndFlush để lưu xuống DB ngay lập tức
    }

    @Transactional
    public void changePassword(String username, String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy tài khoản!"));
        
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác.");
        }
        
        validatePassword(newPassword);
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
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