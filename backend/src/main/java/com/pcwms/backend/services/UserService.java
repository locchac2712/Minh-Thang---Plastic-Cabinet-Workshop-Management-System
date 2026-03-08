package com.pcwms.backend.services;

import com.pcwms.backend.dto.request.UpdateProfileRequest;
import com.pcwms.backend.dto.response.UserProfileResponse;
import com.pcwms.backend.entity.Staff;
import com.pcwms.backend.entity.User;
import com.pcwms.backend.repository.StaffRepository;
import com.pcwms.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StaffRepository staffRepository;

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
}