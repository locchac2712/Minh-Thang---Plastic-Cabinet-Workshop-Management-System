package com.tuplastic.erp.product.entity;

import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.category.entity.Category;
import com.tuplastic.erp.common.entity.BaseEntity;
import com.tuplastic.erp.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(unique = true, nullable = false, length = 100)
    private String sku;

    @Column(nullable = false)
    private String name;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "image_urls", columnDefinition = "jsonb")
    private List<String> imageUrls;

    @Column(name = "cost_price", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal costPrice = BigDecimal.ZERO;

    @Column(name = "suggested_price", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal suggestedPrice = BigDecimal.ZERO;

    @Column(name = "stock_quantity")
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_custom", nullable = false)
    @Builder.Default
    private Boolean isCustom = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id")
    private Agency agency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "resource_url", columnDefinition = "TEXT")
    private String resourceUrl;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 0L;
}
