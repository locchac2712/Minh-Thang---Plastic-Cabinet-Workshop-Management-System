package com.pcwms.backend.services;

import com.pcwms.backend.dto.request.UserCreateRequest;
import com.pcwms.backend.dto.request.UpdateProfileRequest;
import com.pcwms.backend.dto.response.UserProfileResponse;
import com.pcwms.backend.dto.response.UserResponseDTO;
import com.pcwms.backend.entity.Role;
import com.pcwms.backend.entity.Staff;
import com.pcwms.backend.entity.User;
import com.pcwms.backend.repository.RoleRepository;
import com.pcwms.backend.repository.StaffRepository;
import com.pcwms.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private RoleRepository roleRepository;

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

    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAllWithStaffAndRole()
                .stream()
                .map(UserResponseDTO::fromEntity)
                .collect(java.util.stream.Collectors.toList());
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + id));
    }

    @Transactional
    public User createUser(UserCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Tài khoản đã tồn tại. Vui lòng chọn một tên đăng nhập khác.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại trong hệ thống.");
        }

        if (staffRepository.existsByPhoneNumber(request.getPhone())) {
            throw new RuntimeException("Số điện thoại đã tồn tại trong hệ thống.");
        }

        // 1. Tạo User
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        
        // Sử dụng mật khẩu từ request hoặc mặc định nếu trống
        String rawPassword = (request.getPassword() != null && !request.getPassword().trim().isEmpty()) 
                ? request.getPassword() 
                : "123456";
        user.setPassword(passwordEncoder.encode(rawPassword));
        
        Role role = roleRepository.findByRoleName("ROLE_" + request.getRole())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò: " + request.getRole()));
        user.setRole(role);
        user.setIsActive(true);
        
        User savedUser = userRepository.save(user);

        // 2. Tạo Staff tương ứng
        Staff staff = new Staff();
        staff.setUser(savedUser);
        staff.setFullname(request.getFullName());
        staff.setPhoneNumber(request.getPhone());
        staff.setAddress(request.getAddress());
        // Có thể sinh employeeId tự động hoặc để trống
        staff.setEmployeeId("EMP-" + System.currentTimeMillis() % 10000);
        staffRepository.save(staff);

        return savedUser;
    }

    @Transactional
    public User updateUser(Long id, UserCreateRequest request, String currentUsername) {
        User existingUser = getUserById(id);
        
        // Ngăn chặn đổi vai trò của chính mình
        if (existingUser.getUsername().equals(currentUsername) && request.getRole() != null) {
            String newRole = "ROLE_" + request.getRole();
            if (!existingUser.getRole().getRoleName().equals(newRole)) {
                throw new RuntimeException("Bạn không thể tự thay đổi vai trò của chính mình.");
            }
        }

        existingUser.setUsername(request.getUsername());
        existingUser.setEmail(request.getEmail());
        
        if (request.getRole() != null) {
            Role role = roleRepository.findByRoleName("ROLE_" + request.getRole())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò: " + request.getRole()));
            existingUser.setRole(role);
        }

        userRepository.save(existingUser);

        // Cập nhật Staff
        Staff staff = staffRepository.findByUser(existingUser)
                .orElseGet(() -> {
                    Staff newStaff = new Staff();
                    newStaff.setUser(existingUser);
                    return newStaff;
                });
        
        staff.setFullname(request.getFullName());
        staff.setPhoneNumber(request.getPhone());
        staff.setAddress(request.getAddress());
        staffRepository.save(staff);

        return existingUser;
    }

    public void deleteUser(Long id) {
        User user = getUserById(id);
        user.setIsActive(false);
        userRepository.delete(user);
    }


    public UserResponseDTO lockUser(Long id, String currentUsername) {
        User userToLock = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + id));
        
        if (userToLock.getUsername().equals(currentUsername)) {
            throw new RuntimeException("Bạn không thể tự vô hiệu hóa tài khoản của chính mình.");
        }

        if(!userToLock.getIsActive()) {
            throw new RuntimeException("Tài khoản đã bị khóa trước đó.");
        }
        userToLock.setIsActive(false);
        User savedUser = userRepository.save(userToLock);
        return UserResponseDTO.fromEntity(savedUser);
    }

    @Transactional
    public String resetPassword(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + id));
        
        // Sinh mật khẩu ngẫu nhiên 6 chữ số
        String newPassword = String.valueOf((int)((Math.random() * 900000) + 100000));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        return newPassword;
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