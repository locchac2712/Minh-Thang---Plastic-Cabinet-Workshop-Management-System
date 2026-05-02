package com.tuplastic.erp.security.service;

import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.security.entity.PasswordResetToken;
import com.tuplastic.erp.security.mail.PasswordResetMailService;
import com.tuplastic.erp.security.repository.PasswordResetTokenRepository;
import com.tuplastic.erp.security.util.TokenHashUtils;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    /**
     * Message khi đã gửi email thành công (response 200 của {@code POST /api/auth/forgot-password}).
     */
    public static final String FORGOT_PASSWORD_PUBLIC_MESSAGE =
            "Đã gửi email hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (kể cả thư mục spam).";

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordResetMailService mailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.password-reset.token-validity-ms:3600000}")
    private long tokenValidityMs;

    /**
     * Email phải khớp user active. Không tìm thấy → 400. Inactive → 400.
     */
    @Transactional
    public void requestResetByEmail(String emailInput) {
        String emailNorm = normalizeEmail(emailInput);
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(emailNorm);
        if (userOpt.isEmpty()) {
            throw new BadRequestException("Email không tồn tại trong hệ thống.");
        }
        User user = userOpt.get();
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new BadRequestException("Tài khoản không hoạt động.");
        }
        if (!StringUtils.hasText(user.getEmail())) {
            throw new BadRequestException("Email không tồn tại trong hệ thống.");
        }

        if (!mailService.isMailConfigured()) {
            log.warn("Password reset requested but SMTP username or app.mail.from not configured — no email sent.");
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Gửi email chưa được cấu hình trên máy chủ. Vui lòng liên hệ quản trị.");
        }

        tokenRepository.deleteUnusedByUserId(user.getId());

        String plain = generateSecureToken();
        String hash = TokenHashUtils.sha256Hex(plain);
        LocalDateTime expiresAt = LocalDateTime.now(ZONE).plus(Duration.ofMillis(tokenValidityMs));

        PasswordResetToken row = PasswordResetToken.builder()
                .user(user)
                .tokenHash(hash)
                .expiresAt(expiresAt)
                .build();
        tokenRepository.save(row);

        try {
            mailService.sendResetLink(user.getEmail().trim(), plain, user.getFullName());
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", maskEmail(user.getEmail()), e);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Không gửi được email đặt lại mật khẩu. Vui lòng thử lại sau hoặc liên hệ quản trị.");
        }
    }

    @Transactional
    public void resetPassword(String plainToken, String newPassword) {
        String trimmedToken = plainToken == null ? "" : plainToken.trim();
        if (trimmedToken.isEmpty()) {
            throw new BadRequestException("Token không được để trống.");
        }
        String hash = TokenHashUtils.sha256Hex(trimmedToken);
        PasswordResetToken row = tokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new BadRequestException(
                        "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."));
        if (row.getUsedAt() != null || !row.getExpiresAt().isAfter(LocalDateTime.now(ZONE))) {
            throw new BadRequestException(
                    "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
        }

        User u = row.getUser();
        u.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(u);
        row.setUsedAt(LocalDateTime.now(ZONE));
        tokenRepository.save(row);
    }

    private static String normalizeEmail(String emailInput) {
        return emailInput == null ? "" : emailInput.trim().toLowerCase();
    }

    private static String generateSecureToken() {
        byte[] buf = new byte[32];
        new SecureRandom().nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    private static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        int at = email.indexOf('@');
        String local = email.substring(0, at);
        String domain = email.substring(at + 1);
        String maskedLocal = local.length() <= 2 ? "**" : local.charAt(0) + "***" + local.charAt(local.length() - 1);
        return maskedLocal + "@" + domain;
    }
}
