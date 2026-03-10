package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "stock_count_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockCountDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "stock_count_id")
    @JsonIgnore
    private StockCount stockCount;

    @ManyToOne
    @JoinColumn(name = "material_id")
    private Material material;

    @Column(name = "system_quantity")
    private Integer systemQuantity;

    @Column(name = "actual_quantity")
    private Integer actualQuantity;

    @Column(name = "difference")
    private Integer difference;

    @Column(name = "notes")
    private String notes;
}
