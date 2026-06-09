package com.tuplastic.erp.agency.entity;

import com.tuplastic.erp.common.entity.BaseEntity;
import com.tuplastic.erp.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "agencies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Agency extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_seller_id")
    private User assignedSeller;

    @Column(nullable = false, length = 50)
    private String level;

    @Column(length = 20)
    private String phone;

    @Column(length = 255)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(name = "legal_company_name")
    private String legalCompanyName;

    @Column(name = "total_debt", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal totalDebt = BigDecimal.ZERO;

    @Column(name = "max_debt_limit", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal maxDebtLimit = new BigDecimal("50000000");

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 0L;
}
