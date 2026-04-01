package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "sales_order_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private SalesOrder salesOrder;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "salesOrderDetails", "billOfMaterials"})
    private Product product;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "discount", precision = 15, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    // Thêm hàm này thì lúc trả JSON về FE, tự động nó sẽ ra trường "totalLineAmount"
    public BigDecimal getTotalLineAmount() {
        if (unitPrice == null || quantity == null) return BigDecimal.ZERO;
        BigDecimal baseTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        return baseTotal.subtract(discount != null ? discount : BigDecimal.ZERO);
    }
}