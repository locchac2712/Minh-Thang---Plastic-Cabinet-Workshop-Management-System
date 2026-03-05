package com.pcwms.backend.services;

import com.pcwms.backend.entity.Supplier;
import com.pcwms.backend.repository.SuppilerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SupplierService {
    @Autowired
    private SuppilerRepository supplierRepository;

    // lay danh sach supplier
    public List<Supplier> getAllSuppiler() {
        return  supplierRepository.findAll();
    }

    // lay 1 supplier
    public Supplier findById(Long id) {
        return supplierRepository.findById(id).
                orElseThrow(()-> new RuntimeException("Không tìm tháy nhà cung cấp với ID: " + id));
    }

    // create supplier
    public Supplier createSupplier(Supplier supplier) {
        if(supplierRepository.findById(supplier.getId()).isPresent()) {
            throw new RuntimeException("Nhà cung cấp đã tồn tại.");
        }
        return supplierRepository.save(supplier);
    }

    // update supplier info
    public Supplier updateSupplier(Long id,Supplier supplier) {
        Supplier supplier1 = findById(id);
        supplier1.setName(supplier.getName());
        supplier1.setContactInfo(supplier.getContactInfo());
        return supplierRepository.save(supplier1);
    }

    //delete supplier
    public void deleteSupplier(Long id) {
        Supplier supplier1 = findById(id);
        supplierRepository.delete(supplier1);
    }
}
