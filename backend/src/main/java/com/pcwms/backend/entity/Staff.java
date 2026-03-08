package com.pcwms.backend.entity;

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
    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @Column(name= "fullname", nullable = false)
    private String fullname;

    @Column(name= "department")
    private String department;

    @Column(name= "empoyee_id",unique = true)
    private String employeeId; // Mã nhân viên duy nhất

    @Column(name= "phone_number")
    private String phoneNumber;

    @OneToMany(mappedBy = "staff")
    private List<WarehouseTransaction> warehouseTransactions;
}
