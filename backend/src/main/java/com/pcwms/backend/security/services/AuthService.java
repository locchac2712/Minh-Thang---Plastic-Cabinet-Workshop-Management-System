package com.pcwms.backend.security.services; // Giữ nguyên package theo cấu trúc thư mục của bạn

import com.pcwms.backend.entity.User;
import com.pcwms.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service // Bắt buộc phải có annotation này để Spring Boot biết đây là Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JavaMailSender mailSender;

    // ==========================================
    // 1. HÀM XỬ LÝ: GỬI YÊU CẦU QUÊN MẬT KHẨU
    // ==========================================
    public String forgotPassword(String email) {
        // 1. Tìm user dưới Database xem có ai dùng email này không
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy tài khoản với email này!"));

        // 2. Sinh ra 1 đoạn mã Token ngẫu nhiên (VD: 550e8400-e29b-41d4-a716-446655440000)
        String token = UUID.randomUUID().toString();

        // 3. Lưu mã Token đó vào người dùng này, kèm theo thời hạn 15 phút
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user); // Lưu xuống DB

       //   TẠO VÀ GỬI EMAIL THẬT
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("[PCWMS Hệ thống] - Yêu cầu khôi phục mật khẩu");
            message.setText("Chào bạn,\n\n"
                    + "Hệ thống vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n"
                    + "Vui lòng copy mã Token dưới đây và dán vào ứng dụng để đổi mật khẩu mới:\n\n"
                    + "MÃ TOKEN: " + token + "\n\n"
                    + "⚠️ Lưu ý: Mã xác nhận này sẽ hết hạn trong vòng 15 phút.\n"
                    + "Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.\n\n"
                    + "Trân trọng,\nBan Quản Trị Hệ Thống.");

            mailSender.send(message); // Bấm nút gửi!

        } catch (Exception e) {
            System.out.println("Lỗi gửi mail: " + e.getMessage());
            throw new RuntimeException("Lỗi: Không thể gửi email, vui lòng kiểm tra lại cấu hình hệ thống!");
        }
        return "Thành công! Một email chứa mã khôi phục đã được gửi đến hòm thư của bạn.";

        // 4. In tạm ra màn hình Console để lát nữa copy test trên Postman
//        System.out.println("========== MÃ TOKEN QUÊN MẬT KHẨU ==========");
//        System.out.println("Email yêu cầu: " + email);
//        System.out.println("Mã Token sinh ra: " + token);
//        System.out.println("Hạn sử dụng: 15 phút");
//        System.out.println("============================================");
//
//        return "Đã tạo mã Token thành công. (Vui lòng kiểm tra Console của máy chủ để lấy mã)";
    }

    // ==========================================
    // 2. HÀM XỬ LÝ: ĐẶT LẠI MẬT KHẨU MỚI
    // ==========================================
    public void resetPassword(String token, String newPassword) {
        // 1. Tìm user dựa trên cái mã Token mà Frontend gửi lên
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Lỗi: Mã xác nhận không hợp lệ hoặc không tồn tại!"));

        // 2. Kiểm tra xem mã đó có bị quá hạn 15 phút chưa?
        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Lỗi: Mã xác nhận đã hết hạn (quá 15 phút)! Vui lòng yêu cầu mã mới.");
        }

        // 3. Mã hóa cái mật khẩu mới và lưu đè vào DB
        user.setPassword(passwordEncoder.encode(newPassword));

        // 4. Dọn dẹp: Xóa cái mã Token đi để user không dùng lại cái mã này được nữa (Bảo mật 1 lần)
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }
}