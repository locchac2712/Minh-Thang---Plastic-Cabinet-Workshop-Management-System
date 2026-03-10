package com.pcwms.backend.services;

import com.pcwms.backend.dto.request.TransactionDetailRequest;
import com.pcwms.backend.dto.request.WarehouseTransactionRequest;
import com.pcwms.backend.entity.*;
import com.pcwms.backend.repository.MaterialRepository;
import com.pcwms.backend.repository.StaffRepository;
import com.pcwms.backend.repository.WarehouseTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class WarehouseService {

    @Autowired
    private WarehouseTransactionRepository transactionRepository;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Transactional
    public WarehouseTransaction importMaterials(WarehouseTransactionRequest request, Long currentUserId) {

        // 1. Kiểm tra xem tài khoản này đã có hồ sơ Nhân viên (Staff) chưa
        Staff staff = staffRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new RuntimeException("Lỗi: Tài khoản của bạn chưa được liên kết với hồ sơ Nhân viên (Staff)!"));

        // 2. Tạo Phiếu Kho Mẹ
        WarehouseTransaction transaction = new WarehouseTransaction();
        transaction.setType(TransactionType.IMPORT); // Đây là phiếu NHẬP
        transaction.setDate(LocalDateTime.now());
        transaction.setStaff(staff); // Ai là người nhập?

        // Nếu Entity của bạn đang có cột referenceId thì mở comment dòng dưới:
        transaction.setReferenceId(request.getReferenceId());

        List<TransactionDetail> details = new ArrayList<>();

        // 3. Xử lý từng dòng hàng hóa
        for (TransactionDetailRequest item : request.getDetails()) {

            if (item.getMaterialId() == null) {
                throw new RuntimeException("BẮT ĐƯỢC LỖI: materialId truyền từ Postman lên đang bị null. Hãy check lại JSON!");
            }

            if (item.getQuantity() <= 0) {
                throw new RuntimeException("Số lượng nhập phải lớn hơn 0!");
            }

            Material material = materialRepository.findById(item.getMaterialId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Nguyên vật liệu với ID: " + item.getMaterialId()));

            // A. Tăng số lượng trong kho
            int currentStock = material.getCurrentStock() == null ? 0 : material.getCurrentStock();
            material.setCurrentStock(currentStock + item.getQuantity());
            materialRepository.save(material); // Lưu thay đổi tồn kho

            // B. Ghi chú lại vào Chi tiết phiếu
            TransactionDetail detail = new TransactionDetail();
            detail.setWarehouseTransaction(transaction); // Nối với phiếu mẹ
            detail.setMaterial(material);
            detail.setQuantity(item.getQuantity());

            details.add(detail);
        }

        // 4. Lưu tất cả vào Database
        transaction.setDetails(details);
        return transactionRepository.save(transaction);
    }

    @Transactional
    public WarehouseTransaction exportMaterials(WarehouseTransactionRequest request, Long currentUserId) {

        // 1. Kiểm tra xem tài khoản này đã có hồ sơ Nhân viên (Staff) chưa
        Staff staff = staffRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new RuntimeException("Lỗi: Tài khoản của bạn chưa được liên kết với hồ sơ Nhân viên (Staff)!"));

        // 2. Tạo Phiếu Kho Mẹ
        WarehouseTransaction transaction = new WarehouseTransaction();
        transaction.setType(TransactionType.EXPORT); // Đây là phiếu XUẤT
        transaction.setDate(LocalDateTime.now());
        transaction.setStaff(staff); 
        transaction.setReferenceId(request.getReferenceId());

        List<TransactionDetail> details = new ArrayList<>();

        // 3. Xử lý từng dòng hàng hóa
        for (TransactionDetailRequest item : request.getDetails()) {

            if (item.getMaterialId() == null) {
                throw new RuntimeException("BẮT ĐƯỢC LỖI: materialId truyền lên đang bị null!");
            }

            if (item.getQuantity() <= 0) {
                throw new RuntimeException("Số lượng xuất phải lớn hơn 0!");
            }

            Material material = materialRepository.findById(item.getMaterialId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Nguyên vật liệu với ID: " + item.getMaterialId()));

            // A. Kiểm tra tồn kho đủ để xuất không?
            int currentStock = material.getCurrentStock() == null ? 0 : material.getCurrentStock();
            if (currentStock < item.getQuantity()) {
                throw new RuntimeException("Lỗi không đủ tồn kho! Nguyên vật liệu["+material.getName()+"] hiện chỉ còn "+currentStock+" "+material.getUnit());
            }

            // B. Giảm số lượng trong kho
            material.setCurrentStock(currentStock - item.getQuantity());
            materialRepository.save(material); // Lưu thay đổi tồn kho

            // C. Ghi chú lại vào Chi tiết phiếu
            TransactionDetail detail = new TransactionDetail();
            detail.setWarehouseTransaction(transaction);
            detail.setMaterial(material);
            detail.setQuantity(item.getQuantity());

            details.add(detail);
        }
        transaction.setDetails(details);
        return transactionRepository.save(transaction);
    }
}