package com.pcwms.backend.services;

import com.pcwms.backend.dto.request.TransactionDetailRequest;
import com.pcwms.backend.dto.request.WarehouseTransactionRequest;
import com.pcwms.backend.dto.response.TransactionDetailResponse;
import com.pcwms.backend.dto.response.WarehouseTransactionResponse;
import com.pcwms.backend.entity.*;
import com.pcwms.backend.repository.MaterialRepository;
import com.pcwms.backend.repository.ProductRepository;
import com.pcwms.backend.repository.StaffRepository;
import com.pcwms.backend.repository.WarehouseTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WarehouseTransactionService {
    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private WarehouseTransactionRepository transactionRepository;
    // Hàm mới: Trả về Page thay vì List
    public Page<WarehouseTransactionResponse> getExportTransactionsWithPagination(String keyword, int page, int size) {

        // Tạo cấu hình phân trang (Sắp xếp theo ngày mới nhất giảm dần)
        Pageable pageable = PageRequest.of(page, size, Sort.by("date").descending());

        Page<WarehouseTransaction> transactionPage;

        // Kiểm tra xem Frontend có gửi từ khóa tìm kiếm lên không
        if (keyword != null && !keyword.trim().isEmpty()) {
            // Có tìm kiếm -> Gọi hàm search
            transactionPage = transactionRepository.searchByTypeAndKeyword(TransactionType.EXPORT, keyword.trim(), pageable);
        } else {
            // Không tìm kiếm -> Lấy tất cả
            transactionPage = transactionRepository.findByType(TransactionType.EXPORT, pageable);
        }

        // Chuyển đổi Entity sang DTO
        return transactionPage.map(transaction -> {

            // Map List Details
            List<TransactionDetailResponse> detailResponses = transaction.getDetails().stream().map(detail -> {
                String itemName = detail.getProduct() != null ? detail.getProduct().getName() :
                        (detail.getMaterial() != null ? detail.getMaterial().getName() : "");
                String itemType = detail.getProduct() != null ? "PRODUCT" : "MATERIAL";

                return new TransactionDetailResponse(detail.getId(), itemName, itemType, detail.getQuantity());
            }).collect(Collectors.toList());

            // Map Vỏ phiếu
            return new WarehouseTransactionResponse(
                    transaction.getId(),
                    transaction.getType().name(),
                    transaction.getReferenceId(),
                    transaction.getDate(),
                    transaction.getStaff() != null ? transaction.getStaff().getFullname() : "N/A",
                    detailResponses
            );
        });
    }

    @Transactional(rollbackFor = Exception.class) // Lỗi phát là hoàn tác toàn bộ DB ngay!
    public WarehouseTransactionResponse createTransaction(WarehouseTransactionRequest request) {

        // 1. Kiểm tra ông thủ kho có tồn tại không
        Staff staff = staffRepository.findById(request.getStaffId())
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy nhân viên thủ kho!"));

        // 2. Khởi tạo cái vỏ phiếu kho
        WarehouseTransaction transaction = new WarehouseTransaction();
        transaction.setType(request.getType());
        transaction.setReferenceId(request.getReferenceId());
        transaction.setDate(java.time.LocalDateTime.now());
        transaction.setStaff(staff);

        List<TransactionDetail> details = new ArrayList<>();

        // 3. Quét từng dòng chi tiết để xử lý logic TỒN KHO
        for (TransactionDetailRequest reqDetail : request.getDetails()) {
            TransactionDetail detail = new TransactionDetail();
            detail.setWarehouseTransaction(transaction);
            detail.setQuantity(reqDetail.getQuantity());

            // TH1: Nếu thao tác với THÀNH PHẨM (Product)
            if (reqDetail.getProductId() != null) {
                Product product = productRepository.findById(reqDetail.getProductId())
                        .orElseThrow(() -> new RuntimeException("Lỗi: Sản phẩm không tồn tại!"));

                if (request.getType() == TransactionType.EXPORT) {
                    // XUẤT KHO: Kiểm tra xem kho còn đủ hàng không?
                    if (product.getCurrentStock() < reqDetail.getQuantity()) {
                        throw new RuntimeException("Kho không đủ hàng! SP: " + product.getName() +
                                " (Tồn: " + product.getCurrentStock() + ", Cần xuất: " + reqDetail.getQuantity() + ")");
                    }
                    // Đủ thì trừ đi
                    product.setCurrentStock(product.getCurrentStock() - reqDetail.getQuantity());
                } else {
                    // NHẬP KHO: Cộng thêm vào
                    product.setCurrentStock(product.getCurrentStock() + reqDetail.getQuantity());
                }

                productRepository.save(product); // Chốt sổ số lượng mới
                detail.setProduct(product);
            }
            // TH2: Nếu thao tác với VẬT TƯ (Material)
            else if (reqDetail.getMaterialId() != null) {
                Material material = materialRepository.findById(reqDetail.getMaterialId())
                        .orElseThrow(() -> new RuntimeException("Lỗi: Vật tư không tồn tại!"));

                if (request.getType() == TransactionType.EXPORT) {
                    if (material.getCurrentStock() < reqDetail.getQuantity()) {
                        throw new RuntimeException("Kho không đủ vật tư! VT: " + material.getName() +
                                " (Tồn: " + material.getCurrentStock() + ", Cần xuất: " + reqDetail.getQuantity() + ")");
                    }
                    material.setCurrentStock(material.getCurrentStock() - reqDetail.getQuantity());
                } else {
                    material.setCurrentStock(material.getCurrentStock() + reqDetail.getQuantity());
                }

                materialRepository.save(material);
                detail.setMaterial(material);
            } else {
                throw new RuntimeException("Lỗi: Dòng chi tiết phải truyền vào productId hoặc materialId!");
            }

            details.add(detail);
        }

        // 4. Lưu toàn bộ phiếu và chi tiết vào Database
        transaction.setDetails(details);
        WarehouseTransaction savedTransaction = transactionRepository.save(transaction);

        // 5. Trả về đúng 1 string thông báo (hoặc map ra DTO Response tùy Frontend yêu cầu)
        return null; // Tạm thời để null vì hàm này mình trả về ResponseEntity bên Controller cho tiện
    }
}