package com.pcwms.backend.entity;

import jakarta.persistence.*;
import jakarta.persistence.Table;
import lombok.Data;
import java.util.List;

@Entity
@Table(name = "supplier")
@Data
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "contact_info")
    private String contactInfo;

    // --- QUAN HỆ (Mapping ngược) ---
    // Một nhà cung cấp có thể cung cấp nhiều nguyên liệu
    @OneToMany(mappedBy = "supplier")
    private List<SupplierMaterial> supplierMaterials;

    // Một nhà cung cấp có thể nhận nhiều hóa đơn mua hàng (Purchase Invoice)
    //@OneToMany(mappedBy = "supplier")
    //private List<PurchaseInvoice> purchaseInvoices;
}
