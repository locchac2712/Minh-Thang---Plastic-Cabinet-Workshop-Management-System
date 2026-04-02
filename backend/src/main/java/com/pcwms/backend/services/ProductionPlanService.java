package com.pcwms.backend.services;

import com.pcwms.backend.entity.*;
import com.pcwms.backend.repository.ManufactureOrderRepository;
import com.pcwms.backend.repository.ProductionPlanRepository;
import com.pcwms.backend.repository.SalesOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductionPlanService {

    private final ProductionPlanRepository productionPlanRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final ManufactureOrderRepository manufactureOrderRepository;

    @Transactional
    public ProductionPlan createPlanFromSalesOrder(Long salesOrderId, LocalDate startDate, LocalDate endDate) {
        // 1. Kiểm tra xem đã có kế hoạch cho đơn hàng này chưa
        if (productionPlanRepository.findBySalesOrderId(salesOrderId).isPresent()) {
            throw new RuntimeException("Đơn hàng này đã được lập kế hoạch sản xuất.");
        }

        SalesOrder salesOrder = salesOrderRepository.findById(salesOrderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + salesOrderId));

        // 2. Tạo Kế hoạch mới
        ProductionPlan plan = new ProductionPlan();
        plan.setSalesOrder(salesOrder);
        plan.setPlanName("Kế hoạch sản xuất cho " + salesOrder.getOrderNumber());
        plan.setStartDate(startDate);
        plan.setEndDate(endDate);
        plan.setStatus("PLANNED");

        ProductionPlan savedPlan = productionPlanRepository.save(plan);

        // 3. Tạo các Lệnh sản xuất (Work Orders) cho từng sản phẩm trong đơn hàng
        for (SalesOrderDetail detail : salesOrder.getDetails()) {
            ManufactureOrder mo = new ManufactureOrder();
            mo.setSalesOrder(salesOrder);
            mo.setProductionPlan(savedPlan);
            mo.setProduct(detail.getProduct());
            mo.setQuantity(detail.getQuantity());
            mo.setWipStatus("PLANNED");
            
            manufactureOrderRepository.save(mo);
        }

        // Cập nhật trạng thái đơn hàng sang "IN_PROGRESS" (Đang thực hiện sản xuất)
        salesOrder.setStatus("PROCESSING");
        salesOrderRepository.save(salesOrder);

        return savedPlan;
    }

    public List<ProductionPlan> getAllPlans() {
        return productionPlanRepository.findAll();
    }

    public ProductionPlan getPlanById(Long id) {
        return productionPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kế hoạch ID: " + id));
    }

    @Transactional
    public void updateManufactureOrderStatus(Long moId, String status) {
        ManufactureOrder mo = manufactureOrderRepository.findById(moId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lệnh sản xuất ID: " + moId));
        mo.setWipStatus(status);
        manufactureOrderRepository.save(mo);

        // Nếu tất cả MO trong Plan đều COMPLETED thì Plan cũng COMPLETED
        ProductionPlan plan = mo.getProductionPlan();
        if (plan != null) {
            boolean allDone = plan.getManufactureOrders().stream()
                    .allMatch(item -> "COMPLETED".equals(item.getWipStatus()));
            if (allDone) {
                plan.setStatus("COMPLETED");
                productionPlanRepository.save(plan);
                
                // Cập nhật SalesOrder sang READY_TO_DELIVER hoặc tương đương nếu cần
            } else {
                plan.setStatus("IN_PROGRESS");
                productionPlanRepository.save(plan);
            }
        }
    }
}
