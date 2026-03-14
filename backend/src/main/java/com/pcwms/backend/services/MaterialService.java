package com.pcwms.backend.services;

import com.pcwms.backend.dto.response.MaterialResponse; // DTO này bạn nhớ cập nhật thêm AverageUnitCost nhé
import com.pcwms.backend.entity.Material;
import com.pcwms.backend.repository.MaterialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MaterialService {

    @Autowired
    private MaterialRepository materialRepository;

    // Lấy chi tiết 1 mã và Map sang DTO
    public MaterialResponse getMaterialDetail(Long id) {
        Material material = getMaterialById(id);
        return new MaterialResponse(material);
    }

    // 1. UPDATE: Lấy danh sách Vật tư ĐANG HOẠT ĐỘNG
    public List<MaterialResponse> getAllMaterialsWithAlert() {
        // 👉 Đã sửa lỗi: Lọc chuẩn xác những mã có isActive = true
        List<Material> activeMaterials = materialRepository.findAll().stream()
                .filter(Material::getIsActive)
                .collect(Collectors.toList());

        return activeMaterials.stream()
                .map(MaterialResponse::new)
                .collect(Collectors.toList());
    }

    // 2. GIỮ NGUYÊN: Lấy chi tiết 1 mã (Ném lỗi nếu không thấy)
    public Material getMaterialById(Long id) {
        return materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Nguyên vật liệu với ID: " + id));
    }

    // 3. UPDATE: Thêm mới (Check trùng tên + Trùng SKU)
    public Material createMaterial(Material material) {
        if (materialRepository.existsByName(material.getName())) {
            throw new RuntimeException("Lỗi: Tên nguyên vật liệu đã tồn tại trong hệ thống!");
        }

        // 👉 BỔ SUNG: Chặn tạo trùng Mã Kho (SKU)
        if (material.getSku() != null && materialRepository.existsBySku(material.getSku())) {
            throw new RuntimeException("Lỗi: Mã SKU này đã được sử dụng cho vật tư khác!");
        }

        if (material.getMinStockLevel() != null && material.getMinStockLevel() < 0) {
            throw new RuntimeException("Lỗi: Ngưỡng tồn tối thiểu không được để số âm!");
        }

        // Đảm bảo dữ liệu mặc định chuẩn Kế toán
        if (material.getAverageUnitCost() == null) {
            material.setAverageUnitCost(BigDecimal.ZERO);
        }
        material.setIsActive(true); // Đổi thành setIsActive theo đúng Entity mới

        return materialRepository.save(material);
    }

    // 4. UPDATE: Sửa thông tin cơ bản
    public Material updateMaterial(Long id, Material materialDetails) {
        Material existing = getMaterialById(id);

        // Check xem có đổi sang một cái SKU đã tồn tại của thằng khác không
        if (materialDetails.getSku() != null
                && !materialDetails.getSku().equals(existing.getSku())
                && materialRepository.existsBySku(materialDetails.getSku())) {
            throw new RuntimeException("Lỗi: Mã SKU cập nhật đã bị trùng với vật tư khác!");
        }

        existing.setName(materialDetails.getName());
        existing.setSku(materialDetails.getSku());
        existing.setUnit(materialDetails.getUnit());
        existing.setMinStockLevel(materialDetails.getMinStockLevel());
        existing.setDescription(materialDetails.getDescription());

        // Lưu ý: Tuyệt đối KHÔNG update current_stock hay average_unit_cost ở đây.
        // Hai cột đó chỉ được thay đổi khi có sự kiện Nhập/Xuất kho!

        return materialRepository.save(existing);
    }

    // 5. GIỮ NGUYÊN: Cập nhật nhanh ngưỡng an toàn
    @Transactional
    public Material updateMinStock(Long id, Integer newLimit) {
        if (newLimit < 0) throw new RuntimeException("Lỗi: Ngưỡng an toàn không được âm!");
        Material material = getMaterialById(id);
        material.setMinStockLevel(newLimit);
        return materialRepository.save(material);
    }

    // 6. UPDATE: Xóa mềm (Soft Delete)
    @Transactional
    public void deleteMaterial(Long id) {
        Material material = getMaterialById(id);
        material.setIsActive(false); // 👉 Đổi thành setIsActive
        materialRepository.save(material);
    }
}