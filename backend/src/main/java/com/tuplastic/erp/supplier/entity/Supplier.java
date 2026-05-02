package com.tuplastic.erp.supplier.entity;

import com.tuplastic.erp.common.entity.BaseEntity;
import com.tuplastic.erp.material.entity.Material;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "suppliers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Supplier extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(length = 20)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(name = "total_debt", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal totalDebt = BigDecimal.ZERO;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 0L;

    @ManyToMany(mappedBy = "suppliers")
    @Builder.Default
    private Set<Material> materials = new HashSet<>();
}
