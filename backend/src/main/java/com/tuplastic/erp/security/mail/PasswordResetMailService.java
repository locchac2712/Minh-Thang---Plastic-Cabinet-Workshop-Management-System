package com.tuplastic.erp.security.mail;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class PasswordResetMailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${app.mail.from:}")
    private String fromAddress;

    @Value("${app.password-reset.frontend-url:http://localhost:5173/reset-password}")
    private String frontendBaseUrl;

    public boolean isMailConfigured() {
        return StringUtils.hasText(smtpUsername) && StringUtils.hasText(fromAddress);
    }

    public void sendResetLink(String toEmail, String plainToken, String recipientName) throws Exception {
        String sep = frontendBaseUrl.contains("?") ? "&" : "?";
        String link = frontendBaseUrl + sep + "token=" + encodeTokenQuery(plainToken);

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
        helper.setFrom(new InternetAddress(fromAddress.trim()));
        helper.setTo(toEmail.trim());
        helper.setSubject("Đặt lại mật khẩu — TuPlastic ERP");
        String greet = recipientName != null && !recipientName.isBlank() ? recipientName.strip() : "bạn";
        helper.setText(
                "Xin chào " + greet + ",\n\n"
                        + "Bạn đã yêu cầu đặt lại mật khẩu. Mở liên kết sau (hiệu lực trong thời gian giới hạn):\n\n"
                        + link
                        + "\n\n"
                        + "Nếu bạn không thực hiện yêu cầu này, có thể bỏ qua email.\n",
                false);

        mailSender.send(message);
    }

    private static String encodeTokenQuery(String plainToken) {
        return java.net.URLEncoder.encode(plainToken, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
