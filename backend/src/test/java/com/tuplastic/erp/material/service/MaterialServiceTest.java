package com.tuplastic.erp.material.service;

import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.material.mapper.MaterialMapper;
import com.tuplastic.erp.material.repository.MaterialRepository;
import com.tuplastic.erp.supplier.repository.SupplierRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MaterialServiceTest {

    @Mock
    private MaterialRepository materialRepository;

    @Mock
    private MaterialMapper materialMapper;

    @Mock
    private SupplierRepository supplierRepository;

    @InjectMocks
    private MaterialService materialService;

    @Test
    void getMaterialsBySupplier_throwsWhenSupplierMissing() {
        UUID sid = UUID.fromString("11111111-1111-1111-1111-111111111111");
        when(supplierRepository.existsById(sid)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class,
                () -> materialService.getMaterialsBySupplier(sid, null, null, 0, 20));
        verifyNoInteractions(materialRepository);
    }
}
