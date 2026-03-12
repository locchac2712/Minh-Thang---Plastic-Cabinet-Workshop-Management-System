package com.pcwms.backend.security.services;

import com.pcwms.backend.entity.User;
import com.pcwms.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JavaMailSender mailSender;

    // 👉 HÀM HỖ TRỢ: SINH MÃ OTP 6 SỐ BẢO MẬT CAO
    private String generate6DigitOTP() {
        SecureRandom random = new SecureRandom();
        int num = random.nextInt(1000000); // Sinh số ngẫu nhiên từ 0 đến 999999
        return String.format("%06d", num); // Ép format luôn đủ 6 chữ số (VD: 004567)
    }

    // ==========================================
    // 1. HÀM XỬ LÝ: GỬI YÊU CẦU QUÊN MẬT KHẨU
    // ==========================================
    public String forgotPassword(String email) {
        // 1. Tìm user dưới Database xem có ai dùng email này không
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy tài khoản với email này!"));

        // 2. Sinh ra mã OTP 6 số thay vì UUID
        String otp = generate6DigitOTP();

        // 3. Lưu mã OTP đó vào người dùng này, kèm theo thời hạn rút xuống còn 5 PHÚT (Bảo mật cao)
        user.setResetToken(otp);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user); // Lưu xuống DB

        // 4. TẠO VÀ GỬI EMAIL THẬT
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("[PCWMS] - Mã OTP khôi phục mật khẩu");
            message.setText("Chào bạn,\n\n"
                    + "Hệ thống vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n"
                    + "Vui lòng sử dụng mã OTP gồm 6 chữ số dưới đây để xác thực:\n\n"
                    + "MÃ OTP: " + otp + "\n\n"
                    + "⚠️ Lưu ý: Mã xác nhận này sẽ hết hạn trong vòng 5 phút.\n"
                    + "Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.\n\n"
                    + "Trân trọng,\nBan Quản Trị Hệ Thống.");

            mailSender.send(message); // Bấm nút gửi!

        } catch (Exception e) {
            System.out.println("Lỗi gửi mail: " + e.getMessage());
            throw new RuntimeException("Lỗi: Không thể gửi email, vui lòng kiểm tra lại cấu hình hệ thống!");
        }

        // Log tạm ra màn hình Console để test API mượt mà không cần check mail liên tục
        System.out.println("========== MÃ OTP QUÊN MẬT KHẨU ==========");
        System.out.println("Email yêu cầu: " + email);
        System.out.println("Mã OTP sinh ra: " + otp);
        System.out.println("Hạn sử dụng: 5 phút");
        System.out.println("==========================================");

        return "Thành công! Một email chứa mã OTP 6 số đã được gửi đến hòm thư của bạn.";
    }

    // ==========================================
    // 2. HÀM XỬ LÝ: ĐẶT LẠI MẬT KHẨU MỚI
    // ==========================================
    public void resetPassword(String otp, String newPassword) {
        // 1. Tìm user dựa trên cái mã OTP mà Frontend gửi lên
        User user = userRepository.findByResetToken(otp)
                .orElseThrow(() -> new RuntimeException("Lỗi: Mã OTP không hợp lệ hoặc không tồn tại!"));

        // 2. Kiểm tra xem mã đó có bị quá hạn 5 phút chưa?
        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            // Nếu hết hạn thì xóa luôn mã OTP đó đi cho sạch sẽ
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);
            throw new RuntimeException("Lỗi: Mã OTP đã hết hạn (quá 5 phút)! Vui lòng yêu cầu gửi lại mã mới.");
        }

        // 3. Mã hóa cái mật khẩu mới và lưu đè vào DB
        user.setPassword(passwordEncoder.encode(newPassword));

        // 4. Dọn dẹp: Xóa cái mã OTP đi để user không dùng lại cái mã này được nữa (Bảo mật 1 lần)
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }
}