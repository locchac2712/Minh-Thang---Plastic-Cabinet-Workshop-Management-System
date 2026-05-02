package com.tuplastic.erp.material.entity;

import com.tuplastic.erp.common.entity.BaseEntity;
import com.tuplastic.erp.supplier.entity.Supplier;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "materials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Material extends BaseEntity {

    @Column(unique = true, nullable = false, length = 100)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(nullable = false, length = 50)
    private String unit;

    @Column(name = "unit_cost", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Column(name = "stock_quantity", precision = 15, scale = 4)
    @Builder.Default
    private BigDecimal stockQuantity = BigDecimal.ZERO;

    @Column(name = "min_stock_level", precision = 15, scale = 4)
    @Builder.Default
    private BigDecimal minStockLevel = BigDecimal.ZERO;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 0L;

    @ManyToMany
    @JoinTable(
            name = "material_supplier",
            joinColumns = @JoinColumn(name = "material_id"),
            inverseJoinColumns = @JoinColumn(name = "supplier_id"))
    @Builder.Default
    private Set<Supplier> suppliers = new HashSet<>();
}
