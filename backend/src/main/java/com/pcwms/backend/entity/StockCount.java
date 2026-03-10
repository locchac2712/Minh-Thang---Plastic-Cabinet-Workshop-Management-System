package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "stock_counts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockCount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "count_number")
    private String countNumber;

    @ManyToOne
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;

    @Column(name = "count_date")
    private LocalDate countDate;

    // DRAFT, COMPLETED, CANCELLED
    @Column(name = "status")
    private String status;

    @Column(name = "notes")
    private String notes;

    @ManyToOne
    @JoinColumn(name = "staff_id")
    private Staff staff;

    @OneToMany(mappedBy = "stockCount", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<StockCountDetail> details;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
