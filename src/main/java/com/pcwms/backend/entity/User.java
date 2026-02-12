package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
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

    // Thêm các trường khác theo ERD của bạn nếu cần (fullname, email...)
    // Nếu là staff thì biến sẽ có dữ liệu
    @OneToOne(mappedBy = "user")
    private Staff staff;

    //Nếu là là customer thì biến sẽ có dữ liệu
    @OneToOne(mappedBy = "user")
    private Customer customer;
}