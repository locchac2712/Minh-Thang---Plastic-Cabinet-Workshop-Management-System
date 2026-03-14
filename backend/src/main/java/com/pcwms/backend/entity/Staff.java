package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Table(name = "staff")
@Data
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //Nối với bảng User (khi xóa User thì cũng xóa bảng này (cascade)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore // 👉 GẮN VÀO ĐÂY: Để khi gọi Staff nó không gọi ngược lại User
    private User user;

    @Column(name= "fullname", nullable = false)
    private String fullname;

    @Column(name= "department")
    private String department;

    @Column(name= "empoyee_id",unique = true)
    private String employeeId; // Mã nhân viên duy nhất

    @Column(name= "phone_number")
    private String phoneNumber;

    @Column(name= "address")
    private String address;

    @OneToMany(mappedBy = "staff")
    private List<WarehouseTransaction> warehouseTransactions;


}
