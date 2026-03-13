package com.pcwms.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "warehouse_checks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseCheck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date")
    private LocalDateTime dateTime = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "staff_id")
    private Staff staff;

    @Column(length = 50)
    private String status = "DRAFT";

    @Column(columnDefinition = "TEXT")
    private String note;

    @OneToMany(mappedBy = "warehouseCheck", cascade = CascadeType.ALL,orphanRemoval = true)
    private List<WarehouseCheckDetail> details = new ArrayList<>();

    public void addDetail(WarehouseCheckDetail detail) {
        details.add(detail);
        detail.setWarehouseCheck(this);
    }
}
