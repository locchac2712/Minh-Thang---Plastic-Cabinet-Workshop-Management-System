package com.pcwms.backend.services;

import com.pcwms.backend.dto.response.MaterialResponse;
import com.pcwms.backend.entity.Material;
import com.pcwms.backend.repository.MaterialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MaterialService {

    @Autowired
    private MaterialRepository materialRepository;

    public MaterialResponse getMaterialDetail(Long id) {
        Material material = getMaterialById(id);
        return new MaterialResponse(material);
    }
    // 1. UPDATE: Lấy toàn bộ danh sách kèm logic Cảnh báo (Low Stock Alert)
    public List<MaterialResponse> getAllMaterialsWithAlert() {
        // Chỉ lấy những vật tư đang hoạt động (active = true)
        List<Material> materials = materialRepository.findAll();

        return materials.stream()
                .map(MaterialResponse::new) // Sử dụng Constructor của DTO để tính isLowStock
                .collect(Collectors.toList());
    }

    // 2. GIỮ NGUYÊN: Lấy chi tiết 1 mã
    public Material getMaterialById(Long id) {
        return materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nguyên vật liệu với ID: " + id));
    }

    // 3. UPDATE: Thêm mới (Bổ sung mặc định active = true)
    public Material createMaterial(Material material) {
        if (materialRepository.existsByName(material.getName())) {
            throw new RuntimeException("Tên nguyên vật liệu đã tồn tại trong hệ thống!");
        }
        if (material.getMinStockLevel() != null && material.getMinStockLevel() < 0) {
            throw new RuntimeException("Ngưỡng tồn tối thiểu không được để số âm!");
        }
        // Luôn đảm bảo vật tư mới tạo là đang hoạt động
        material.setActive(true);
        return materialRepository.save(material);
    }

    // 4. GIỮ NGUYÊN: Sửa thông tin cơ bản
    public Material updateMaterial(Long id, Material materialDetails) {
        Material existingMaterial = getMaterialById(id);

        existingMaterial.setName(materialDetails.getName());
        existingMaterial.setUnit(materialDetails.getUnit());
        existingMaterial.setSku(materialDetails.getSku()); // Cập nhật thêm mã SKU nếu có
        existingMaterial.setMinStockLevel(materialDetails.getMinStockLevel());
        existingMaterial.setDescription(materialDetails.getDescription());
        return materialRepository.save(existingMaterial);
    }

    // 5. NEW: Cập nhật nhanh ngưỡng an toàn (Dành cho Manufacture Manager)
    @Transactional
    public Material updateMinStock(Long id, Integer newLimit) {
        if (newLimit < 0) throw new RuntimeException("Ngưỡng an toàn không được âm!");
        Material material = getMaterialById(id);
        material.setMinStockLevel(newLimit);
        return materialRepository.save(material);
    }

    // 6. UPDATE: Chuyển sang Xóa mềm (Soft Delete)
    // Thay vì xóa khỏi DB, ta chỉ ẩn nó đi để bảo vệ dữ liệu lịch sử kho
    @Transactional
    public void deleteMaterial(Long id) {
        Material material = getMaterialById(id);
        material.setActive(false); // Đánh dấu là ngừng sử dụng
        materialRepository.save(material);
    }
}