package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "warehouses")
@Data
public class Warehouse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String code;

    private String location;

    @Column(columnDefinition = "TEXT")
    private String address;

    private Boolean active = true;
}
