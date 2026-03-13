package com.pcwms.backend.services; // Giữ nguyên package của bạn

import com.pcwms.backend.entity.Supplier;
import com.pcwms.backend.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;

    // 1. LẤY DANH SÁCH
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    // 2. LẤY CHI TIẾT THEO ID
    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy Nhà cung cấp với ID: " + id));
    }

    // 3. TẠO MỚI
    public Supplier createSupplier(Supplier supplier) {
        // Kiểm tra trùng Tên
        if (supplierRepository.existsByName(supplier.getName())) {
            throw new RuntimeException("Lỗi: Tên nhà cung cấp này đã tồn tại trong hệ thống!");
        }

        // Kiểm tra trùng Email (nếu người dùng có nhập email)
        if (supplier.getEmail() != null && !supplier.getEmail().isEmpty()) {
            if (supplierRepository.existsByEmail(supplier.getEmail())) {
                throw new RuntimeException("Lỗi: Email này đã được sử dụng cho một nhà cung cấp khác!");
            }
        }

        // Đảm bảo mặc định trạng thái là ACTIVE nếu Frontend quên gửi
        if (supplier.getStatus() == null || supplier.getStatus().trim().isEmpty()) {
            supplier.setStatus("ACTIVE");
        }

        return supplierRepository.save(supplier);
    }

    // 4. CẬP NHẬT
    public Supplier updateSupplier(Long id, Supplier supplierDetails) {
        Supplier existing = getSupplierById(id);

        // Kiểm tra xem họ có đổi sang một cái Email đã tồn tại hay không
        if (supplierDetails.getEmail() != null
                && !supplierDetails.getEmail().equals(existing.getEmail())
                && supplierRepository.existsByEmail(supplierDetails.getEmail())) {
            throw new RuntimeException("Lỗi: Email này đã thuộc về nhà cung cấp khác!");
        }

        // Cập nhật các trường mới
        existing.setName(supplierDetails.getName());
        existing.setContactPerson(supplierDetails.getContactPerson());
        existing.setPhoneNumber(supplierDetails.getPhoneNumber());
        existing.setEmail(supplierDetails.getEmail());
        existing.setAddress(supplierDetails.getAddress());

        // Nếu Frontend có gửi trạng thái (ACTIVE/INACTIVE) thì mới cập nhật
        if (supplierDetails.getStatus() != null && !supplierDetails.getStatus().isEmpty()) {
            existing.setStatus(supplierDetails.getStatus());
        }

        return supplierRepository.save(existing);
    }

    // 5. XÓA MỀM (Soft Delete) - Chuyển trạng thái sang INACTIVE thay vì xóa hẳn
    public void deleteSupplier(Long id) {
        Supplier supplier = getSupplierById(id);

        supplier.setStatus("INACTIVE");

        supplierRepository.save(supplier);
    }
}