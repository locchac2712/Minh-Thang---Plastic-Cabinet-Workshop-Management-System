package com.pcwms.backend.services;

import com.pcwms.backend.dto.request.BomCalcRequest;
import com.pcwms.backend.dto.request.CreateWorkOrderRequest;
import com.pcwms.backend.dto.response.MaterialRequirementResponse;
import com.pcwms.backend.entity.*;
import com.pcwms.backend.repository.BillOfMaterialRepository;
import com.pcwms.backend.repository.ManufactureOrderRepository;
import com.pcwms.backend.repository.ProductRepository;
import com.pcwms.backend.repository.WorkOrderRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkOrderService {

    private final BillOfMaterialRepository bomRepository;
    private final ManufactureOrderRepository manufactureOrderRepository;
    private final ProductRepository  productRepository;
    private final WorkOrderRepository workOrderRepository;

    // API CHUYÊN BIỆT ĐỂ BUNG BOM VÀ CỘNG DỒN VẬT TƯ
    public List<MaterialRequirementResponse> calculateMaterialsNeeded(BomCalcRequest request) {

        // Dùng Map để cộng dồn vật tư. Key: materialId, Value: MaterialRequirementResponse
        Map<Long, MaterialRequirementResponse> materialMap = new HashMap<>();

        for (BomCalcRequest.ProductQuantityItem item : request.getItems()) {

            // 1. Tìm BOM đang Active của Sản phẩm này (Bạn cần viết hàm findByProductIdAndIsActiveTrue trong Repo nhé)
            BillOfMaterial activeBom = bomRepository.findByProductIdAndIsActiveTrue(item.getProductId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm ID " + item.getProductId() + " chưa có BOM nào đang Active!"));

            // Chuyển đổi số lượng cần sản xuất sang kiểu BigDecimal để nhân
            BigDecimal qtyToProduce = BigDecimal.valueOf(item.getQuantity());

            // 2. Duyệt qua từng dòng công thức
            for (BillOfMaterialDetail detail : activeBom.getBomDetails()) {
                Long matId = detail.getMaterial().getId();
                String matName = detail.getMaterial().getName(); // Giả sử Material có name
                String unit = detail.getMaterial().getUnit(); // Giả sử Material có unit

                // Tổng cần = Số lượng làm ra * Định mức 1 cái
                BigDecimal requiredQty = detail.getQuantityRequired().multiply(qtyToProduce);

                // 3. Cộng dồn vào Map
                if (materialMap.containsKey(matId)) {
                    // Đã có rồi -> Cộng dồn
                    MaterialRequirementResponse existing = materialMap.get(matId);
                    existing.setTotalQuantity(existing.getTotalQuantity().add(requiredQty));
                } else {
                    // Chưa có -> Tạo mới
                    MaterialRequirementResponse newEntry = new MaterialRequirementResponse();
                    newEntry.setMaterialId(matId);
                    newEntry.setMaterialName(matName);
                    newEntry.setUnit(unit);
                    newEntry.setTotalQuantity(requiredQty);
                    materialMap.put(matId, newEntry);
                }
            }
        }

        // Trả về List cho FE vẽ bảng
        return materialMap.values().stream().collect(Collectors.toList());
    }

    //API 2: chot va phat hanh len h san xuat
    @Transactional
    public WorkOrder createWorkOrder(CreateWorkOrderRequest request) {

        // 1. Kiểm tra Kế hoạch tổng (MO) có tồn tại không
        ManufactureOrder plan = manufactureOrderRepository.findById(request.getManufactureOrderId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Kế hoạch sản xuất tổng thể: " + request.getManufactureOrderId()));

        // 2. Khởi tạo Lệnh giao việc mới
        WorkOrder wo = new WorkOrder();
        // Mã Lệnh tự sinh: WO - Ngày - Ca - Random (VD: WO-20260405-SANG-1234)
        String dateStr = request.getExecutionDate().toString().replace("-", "");
        wo.setWoNumber(String.format("WO-%s-%s-%d", dateStr, request.getShift(), System.currentTimeMillis() % 10000));

        wo.setManufactureOrder(plan);
        wo.setExecutionDate(request.getExecutionDate());
        wo.setShift(request.getShift());
        wo.setStatus("PENDING"); // Mới tạo thì pending, chờ thợ nhận việc
        wo.setTechnicalNotes(request.getTechicalNotes());

        // 3. Đắp các chi tiết (Sản phẩm) vào Lệnh
        for (CreateWorkOrderRequest.WorkOrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Sản phẩm: " + itemReq.getProductId()));

            WorkOrderDetail detail = new WorkOrderDetail();
            detail.setProduct(product);
            detail.setQuantity(itemReq.getQuantity());

            // Dùng hàm helper đã viết trong Entity để nối quan hệ 2 chiều
            wo.addDetail(detail);
        }

        // 4. Lưu một phát ăn luôn cả bảng Cha (WorkOrder) lẫn bảng Con (WorkOrderDetail) nhờ Cascade
        return workOrderRepository.save(wo);
    }
}