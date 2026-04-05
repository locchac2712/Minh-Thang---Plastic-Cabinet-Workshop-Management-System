package com.pcwms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "work_orders")
@Getter
@Setter
public class WorkOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "wo_number", nullable = false, unique = true)
    private String woNumber; // Mã phiếu. VD: WO-2026-0405-01

    // Phiếu này thuộc về Kế hoạch tổng thể (Manufacture Order) nào?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacture_order_id", nullable = false)
    private ManufactureOrder manufactureOrder;

    // 👉 Chốt ngày làm việc duy nhất
    @Column(name = "execution_date", nullable = false)
    private LocalDate executionDate;

    // Ca làm việc: SANG (Sáng), CHIEU (Chiều), CA_NGAY (Cả ngày)
    @Column(name = "shift")
    private String shift;

    @Column(name = "status", nullable = false)
    private String status = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED

    @Column(name = "technical_notes", columnDefinition = "TEXT")
    private String technicalNotes;

    // Danh sách các sản phẩm cần đóng trong hôm nay
    @OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<WorkOrderDetail> details = new ArrayList<>();

    public void addDetail(WorkOrderDetail detail) {
        details.add(detail);
        detail.setWorkOrder(this);
    }
}