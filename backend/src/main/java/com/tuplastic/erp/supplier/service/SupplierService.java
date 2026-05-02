package com.tuplastic.erp.supplier.service;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.supplier.dto.CreateSupplierRequest;
import com.tuplastic.erp.supplier.dto.SupplierResponse;
import com.tuplastic.erp.supplier.dto.UpdateSupplierRequest;
import com.tuplastic.erp.supplier.entity.Supplier;
import com.tuplastic.erp.supplier.mapper.SupplierMapper;
import com.tuplastic.erp.supplier.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierMapper supplierMapper;

    @Transactional(readOnly = true)
    public PageResponse<SupplierResponse> listSuppliers(String search, Boolean hasDebt, int page, int size) {
        String q = StringUtils.hasText(search) ? search.trim() : null;
        Pageable pageable = PageRequest.of(page, size);
        Page<Supplier> supplierPage = supplierRepository.findAllWithFilters(q, hasDebt, pageable);

        return PageResponse.<SupplierResponse>builder()
                .content(supplierPage.getContent().stream().map(supplierMapper::toResponse).toList())
                .page(supplierPage.getNumber())
                .size(supplierPage.getSize())
                .totalElements(supplierPage.getTotalElements())
                .totalPages(supplierPage.getTotalPages())
                .last(supplierPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public SupplierResponse getSupplierById(UUID id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nhà cung cấp", "id", id));
        return supplierMapper.toResponse(supplier);
    }

    @Transactional
    public SupplierResponse createSupplier(CreateSupplierRequest request) {
        Supplier supplier = Supplier.builder()
                .name(request.getName().trim())
                .phone(StringUtils.hasText(request.getPhone()) ? request.getPhone().trim() : null)
                .address(StringUtils.hasText(request.getAddress()) ? request.getAddress().trim() : null)
                .taxCode(StringUtils.hasText(request.getTaxCode()) ? request.getTaxCode().trim() : null)
                .build();

        return supplierMapper.toResponse(supplierRepository.save(supplier));
    }

    @Transactional
    public SupplierResponse updateSupplier(UUID id, UpdateSupplierRequest request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nhà cung cấp", "id", id));

        if (request.getName() != null) {
            supplier.setName(request.getName().trim());
        }
        if (request.getPhone() != null) {
            supplier.setPhone(StringUtils.hasText(request.getPhone()) ? request.getPhone().trim() : null);
        }
        if (request.getAddress() != null) {
            supplier.setAddress(StringUtils.hasText(request.getAddress()) ? request.getAddress().trim() : null);
        }
        if (request.getTaxCode() != null) {
            supplier.setTaxCode(StringUtils.hasText(request.getTaxCode()) ? request.getTaxCode().trim() : null);
        }

        return supplierMapper.toResponse(supplierRepository.save(supplier));
    }

    @Transactional
    public SupplierResponse toggleActive(UUID id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nhà cung cấp", "id", id));
        supplier.setIsActive(!supplier.getIsActive());
        return supplierMapper.toResponse(supplierRepository.save(supplier));
    }
}
