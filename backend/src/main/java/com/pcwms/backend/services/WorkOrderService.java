package com.pcwms.backend.services;

import com.pcwms.backend.dto.request.BomCalcRequest;
import com.pcwms.backend.dto.request.CreateWorkOrderRequest;
import com.pcwms.backend.dto.response.MaterialRequirementResponse;
import com.pcwms.backend.entity.BillOfMaterial;
import com.pcwms.backend.entity.BillOfMaterialDetail;
import com.pcwms.backend.entity.ManufactureOrder;
import com.pcwms.backend.repository.BillOfMaterialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkOrderService {

    private final BillOfMaterialRepository bomRepository;

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
    public workOrder createWorkOder(CreateWorkOrderRequest request){

    }
}