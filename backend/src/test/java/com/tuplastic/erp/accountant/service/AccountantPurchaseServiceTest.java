package com.tuplastic.erp.accountant.service;

import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.inventory.repository.InventoryLogRepository;
import com.tuplastic.erp.material.entity.Material;
import com.tuplastic.erp.material.repository.MaterialRepository;
import com.tuplastic.erp.purchase.dto.LowStockMaterialAlertResponse;
import com.tuplastic.erp.supplier.entity.Supplier;
import com.tuplastic.erp.purchase.dto.CreatePurchaseLineRequest;
import com.tuplastic.erp.purchase.dto.CreatePurchaseOrderRequest;
import com.tuplastic.erp.purchase.repository.PurchaseOrderRepository;
import com.tuplastic.erp.supplier.entity.Supplier;
import com.tuplastic.erp.supplier.repository.SupplierRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountantPurchaseServiceTest {

    @Mock
    private MaterialRepository materialRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private InventoryLogRepository inventoryLogRepository;

    @InjectMocks
    private AccountantPurchaseService accountantPurchaseService;

    @Test
    void getLowStockAlerts_includesLinkedSuppliersSortedByName() {
        UUID materialId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        UUID supplierAId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID supplierBId = UUID.fromString("33333333-3333-3333-3333-333333333333");

        Supplier supplierB = Supplier.builder().name("Zeta NVL").build();
        supplierB.setId(supplierBId);
        Supplier supplierA = Supplier.builder().name("Alpha NVL").build();
        supplierA.setId(supplierAId);

        Set<Supplier> suppliers = new HashSet<>();
        suppliers.add(supplierB);
        suppliers.add(supplierA);

        Material material = Material.builder()
                .code("NL-001")
                .name("Ván MDF")
                .unit("tấm")
                .stockQuantity(BigDecimal.valueOf(5))
                .minStockLevel(BigDecimal.TEN)
                .suppliers(suppliers)
                .build();
        material.setId(materialId);

        when(materialRepository.findLowStockWithSuppliers()).thenReturn(List.of(material));

        List<LowStockMaterialAlertResponse> alerts = accountantPurchaseService.getLowStockAlerts();

        assertEquals(1, alerts.size());
        LowStockMaterialAlertResponse alert = alerts.get(0);
        assertEquals(materialId, alert.getId());
        assertEquals(2, alert.getSuppliers().size());
        assertEquals("Alpha NVL", alert.getSuppliers().get(0).getName());
        assertEquals("Zeta NVL", alert.getSuppliers().get(1).getName());
    }

    @Test
    void createPurchaseOrder_rejectsUnlinkedMaterialSupplierPair() {
        UUID supplierId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID materialId = UUID.fromString("22222222-2222-2222-2222-222222222222");

        Supplier supplier = Supplier.builder()
                .name("NCC A")
                .isActive(true)
                .totalDebt(BigDecimal.ZERO)
                .build();
        supplier.setId(supplierId);
        Material material = Material.builder()
                .code("PVC")
                .name("Hạt PVC")
                .unit("kg")
                .isActive(true)
                .build();
        material.setId(materialId);

        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(supplier));
        when(materialRepository.findById(materialId)).thenReturn(Optional.of(material));
        when(materialRepository.existsSupplierMaterialLink(supplierId, materialId)).thenReturn(false);

        CreatePurchaseOrderRequest request = new CreatePurchaseOrderRequest();
        request.setSupplierId(supplierId);
        request.setTotalAmount(new BigDecimal("100.0000"));
        CreatePurchaseLineRequest line = new CreatePurchaseLineRequest();
        line.setMaterialId(materialId);
        line.setQuantity(new BigDecimal("10"));
        line.setUnitPrice(new BigDecimal("10"));
        request.setItems(List.of(line));

        assertThrows(BadRequestException.class, () -> accountantPurchaseService.createPurchaseOrder(request));
        verify(purchaseOrderRepository, never()).save(any());
    }

    @Test
    void createPurchaseOrder_rejectsInactiveMaterial() {
        UUID supplierId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID materialId = UUID.fromString("22222222-2222-2222-2222-222222222222");

        Supplier supplier = Supplier.builder()
                .name("NCC A")
                .isActive(true)
                .totalDebt(BigDecimal.ZERO)
                .build();
        supplier.setId(supplierId);
        Material material = Material.builder()
                .code("PVC")
                .name("Hạt PVC")
                .unit("kg")
                .isActive(false)
                .build();
        material.setId(materialId);

        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(supplier));
        when(materialRepository.findById(materialId)).thenReturn(Optional.of(material));

        CreatePurchaseOrderRequest request = new CreatePurchaseOrderRequest();
        request.setSupplierId(supplierId);
        request.setTotalAmount(new BigDecimal("100.0000"));
        CreatePurchaseLineRequest line = new CreatePurchaseLineRequest();
        line.setMaterialId(materialId);
        line.setQuantity(new BigDecimal("10"));
        line.setUnitPrice(new BigDecimal("10"));
        request.setItems(List.of(line));

        assertThrows(BadRequestException.class, () -> accountantPurchaseService.createPurchaseOrder(request));
        verify(materialRepository, never()).existsSupplierMaterialLink(any(), any());
        verify(purchaseOrderRepository, never()).save(any());
    }

    @Test
    void createPurchaseOrder_rejectsInactiveSupplier() {
        UUID supplierId = UUID.fromString("11111111-1111-1111-1111-111111111111");

        Supplier supplier = Supplier.builder()
                .name("NCC A")
                .isActive(false)
                .totalDebt(BigDecimal.ZERO)
                .build();
        supplier.setId(supplierId);

        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(supplier));

        CreatePurchaseOrderRequest request = new CreatePurchaseOrderRequest();
        request.setSupplierId(supplierId);
        request.setTotalAmount(BigDecimal.ZERO);
        request.setItems(List.of());

        assertThrows(BadRequestException.class, () -> accountantPurchaseService.createPurchaseOrder(request));
        verify(materialRepository, never()).findById(any());
        verify(purchaseOrderRepository, never()).save(any());
    }
}
