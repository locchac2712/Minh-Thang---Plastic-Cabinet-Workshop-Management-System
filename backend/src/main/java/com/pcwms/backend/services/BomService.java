package com.pcwms.backend.services;

// 👉 GOM GỌN CÁC IMPORT VÀO ĐÂY CHO ĐẸP MẮT
import com.pcwms.backend.dto.request.BomCreateRequest;
import com.pcwms.backend.dto.request.BomDetailRequest;
import com.pcwms.backend.dto.request.BomUpdateRequest;
import com.pcwms.backend.dto.response.BomDetailViewResponse;
import com.pcwms.backend.dto.response.BomResponse;
import com.pcwms.backend.entity.BillOfMaterial;
import com.pcwms.backend.entity.BillOfMaterialDetail;
import com.pcwms.backend.entity.Material;
import com.pcwms.backend.entity.Product;
import com.pcwms.backend.repository.BillOfMaterialRepository;
import com.pcwms.backend.repository.MaterialRepository;
import com.pcwms.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BomService {

    @Autowired
    private BillOfMaterialRepository bomRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private MaterialRepository materialRepository;

    public List<BomResponse> getAllBoms() {
        return bomRepository.findAll().stream()
                .map(BomResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public BomResponse createBom(BomCreateRequest request) {

        // 1. Kiểm tra Thành phẩm có tồn tại không
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Thành phẩm với ID: " + request.getProductId()));

        // 2. Tạo BOM Cha
        BillOfMaterial bom = new BillOfMaterial();
        bom.setProduct(product);
        bom.setVersion(request.getVersion());
//        bom.setIsApproved(false);
        bom.setIsActive(true);

        // 3. Kiểm tra list Vật tư rỗng
        if (request.getDetails() == null || request.getDetails().isEmpty()) {
            throw new RuntimeException("Định mức phải có ít nhất 1 nguyên vật liệu!");
        }

        // 👉 NGHIỆP VỤ MỚI: Dùng Set để theo dõi và chặn Vật tư bị khai báo trùng lặp trong cùng 1 BOM
        Set<Long> materialIds = new HashSet<>();

        // 4. Lặp qua từng vật tư
        for (BomDetailRequest detailReq : request.getDetails()) {

            // Check trùng lặp
            if (!materialIds.add(detailReq.getMaterialId())) {
                throw new RuntimeException("Vật tư có ID " + detailReq.getMaterialId() + " bị trùng lặp trong danh sách!");
            }

            if (detailReq.getQuantityRequired() == null || detailReq.getQuantityRequired().compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Số lượng vật tư phải lớn hơn 0!");
            }

            Material material = materialRepository.findById(detailReq.getMaterialId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Nguyên vật liệu với ID: " + detailReq.getMaterialId()));

            // Tạo dòng chi tiết
            BillOfMaterialDetail detail = new BillOfMaterialDetail();
            detail.setMaterial(material);
            detail.setQuantityRequired(detailReq.getQuantityRequired());

            // Gắn Con vào Cha
            bom.addBomDetail(detail);
        }

        // 5. Lưu 1 phát ăn luôn cả Cha lẫn Con
        BillOfMaterial savedBom = bomRepository.save(bom);

        // 6. Trả về cho FE
        return new BomResponse(savedBom);
    }

    public com.pcwms.backend.dto.response.BomDetailViewResponse getBomById(Long id) {
        BillOfMaterial bom = bomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Định mức (BOM) với ID: " + id));

        return new com.pcwms.backend.dto.response.BomDetailViewResponse(bom);
    }

    @Transactional
    public BomDetailViewResponse updateBom(Long id, BomUpdateRequest request) {

        // 1. Tìm BOM xem có tồn tại không
        BillOfMaterial bom = bomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Định mức (BOM) với ID: " + id));

        // 2. LUẬT THÉP: Đã duyệt thì cấm sửa!
//        if (bom.getIsApproved()) {
//            throw new RuntimeException("Định mức này đã được duyệt, KHÔNG THỂ chỉnh sửa! Vui lòng Hủy duyệt trước.");
//        }

        // 3. Cập nhật thông tin Header
        bom.setVersion(request.getVersion());
        if (request.getIsActive() != null) {
            bom.setIsActive(request.getIsActive());
        }

        // 4. Validate list vật tư mới
        if (request.getDetails() == null || request.getDetails().isEmpty()) {
            throw new RuntimeException("Định mức phải có ít nhất 1 nguyên vật liệu!");
        }

        // 5. Xóa sạch list vật tư cũ trong bộ nhớ
        bom.getBomDetails().clear();

        Set<Long> materialIds = new HashSet<>();

        // 6. Lặp qua list mới và bơm lại vào Cha
        for (BomDetailRequest detailReq : request.getDetails()) {

            if (!materialIds.add(detailReq.getMaterialId())) {
                throw new RuntimeException("Vật tư có ID " + detailReq.getMaterialId() + " bị trùng lặp!");
            }

            if (detailReq.getQuantityRequired() == null || detailReq.getQuantityRequired().compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Số lượng vật tư phải lớn hơn 0!");
            }

            Material material = materialRepository.findById(detailReq.getMaterialId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Vật tư với ID: " + detailReq.getMaterialId()));

            BillOfMaterialDetail detail = new BillOfMaterialDetail();
            detail.setMaterial(material);
            detail.setQuantityRequired(detailReq.getQuantityRequired());

            bom.addBomDetail(detail);
        }

        // 7. Lưu và trả về DTO
        BillOfMaterial updatedBom = bomRepository.save(bom);
        return new BomDetailViewResponse(updatedBom);
    }
}