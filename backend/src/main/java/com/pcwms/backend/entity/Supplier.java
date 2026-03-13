package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "supplier")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    // 1. Tên người đại diện / Người liên hệ
    @Column(name = "contact_person")
    private String contactPerson;

    // 2. Số điện thoại (Giới hạn 20 ký tự cho an toàn)
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    // 3. Email (Nên để unique = true để tránh nhập trùng 2 nhà cung cấp)
    @Column(name = "email", unique = true)
    private String email;

    // 4. Địa chỉ (Dùng TEXT vì địa chỉ có thể rất dài)
    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    // 5. Trạng thái hoạt động (Mặc định là ACTIVE - Đang giao dịch)
    // Có thể lưu các giá trị như: ACTIVE, INACTIVE, BLACKLISTED (Cấm vận)
    @Column(name = "status", length = 20)
    private String status = "ACTIVE";

    // --- QUAN HỆ (Mapping ngược) ---
    // Một nhà cung cấp có thể cung cấp nhiều nguyên liệu
    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<SupplierMaterial> supplierMaterials;
}