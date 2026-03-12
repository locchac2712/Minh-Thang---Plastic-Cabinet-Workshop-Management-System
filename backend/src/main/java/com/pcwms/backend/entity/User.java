package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false) // Mật khẩu đã mã hóa
    private String password;

    // Quan hệ Many-to-One: Một User có Một Role (Dựa theo ERD của bạn)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", referencedColumnName = "id")
    private Role role;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(unique = true)
    private String email;

    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

    // Thêm các trường khác theo ERD của bạn nếu cần (fullname, email...)
    // Nếu là staff thì biến sẽ có dữ liệu
    @OneToOne(mappedBy = "user")
    private Staff staff;
}