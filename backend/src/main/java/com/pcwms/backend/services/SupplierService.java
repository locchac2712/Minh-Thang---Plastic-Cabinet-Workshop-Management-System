package com.pcwms.backend.services;

import com.pcwms.backend.entity.Supplier;
import com.pcwms.backend.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhà cung cấp với ID: " + id));
    }

    public Supplier createSupplier(Supplier supplier) {
        if (supplierRepository.existsByName(supplier.getName())) {
            throw new RuntimeException("Tên nhà cung cấp đã tồn tại trong hệ thống!");
        }
        return supplierRepository.save(supplier);
    }

    public Supplier updateSupplier(Long id, Supplier supplierDetails) {
        Supplier existing = getSupplierById(id);
        existing.setName(supplierDetails.getName());
        existing.setContactInfo(supplierDetails.getContactInfo());
        return supplierRepository.save(existing);
    }

    public void deleteSupplier(Long id) {
        Supplier supplier = getSupplierById(id);
        // Lưu ý: Nếu NCC đã có lịch sử cung cấp (trong bảng SupplierMaterial), bạn nên cân nhắc đổi sang Xóa mềm (Soft Delete) sau này.
        supplierRepository.delete(supplier);
    }
}