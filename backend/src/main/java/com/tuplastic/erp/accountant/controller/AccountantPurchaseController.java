package com.tuplastic.erp.accountant.controller;

import com.tuplastic.erp.accountant.service.AccountantPurchaseService;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.purchase.dto.CreatePurchaseOrderRequest;
import com.tuplastic.erp.purchase.dto.LowStockMaterialAlertResponse;
import com.tuplastic.erp.purchase.dto.MaterialSupplierPriceHint;
import com.tuplastic.erp.purchase.dto.OpenTaskMaterialNeedItem;
import com.tuplastic.erp.purchase.dto.PayPurchaseRequest;
import com.tuplastic.erp.purchase.dto.PurchaseOrderResponse;
import com.tuplastic.erp.purchase.dto.PurchaseOrderSummaryResponse;
import com.tuplastic.erp.purchase.service.MaterialSupplierPriceInsightService;
import com.tuplastic.erp.purchase.service.OpenTaskMaterialRequirementService;
import com.tuplastic.erp.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/accountant/purchases")
@PreAuthorize("hasRole('ACCOUNTANT')")
@RequiredArgsConstructor
public class AccountantPurchaseController {

    private final AccountantPurchaseService accountantPurchaseService;
    private final OpenTaskMaterialRequirementService openTaskMaterialRequirementService;
    private final MaterialSupplierPriceInsightService materialSupplierPriceInsightService;
    private final SecurityUtils securityUtils;

    @GetMapping("/low-stock-alerts")
    public List<LowStockMaterialAlertResponse> lowStockAlerts() {
        return accountantPurchaseService.getLowStockAlerts();
    }

    /** Nhu cầu NVL từ lệnh sx mở × BOM (chỉ đọc, không trừ PO chưa nhận). */
    @GetMapping("/open-task-material-needs")
    public List<OpenTaskMaterialNeedItem> openTaskMaterialNeeds() {
        return openTaskMaterialRequirementService.listOpenTaskMaterialNeeds();
    }

    @GetMapping("/material-supplier-prices")
    public List<MaterialSupplierPriceHint> materialSupplierPrices(
            @RequestParam(name = "material_id", required = false) UUID materialId) {
        return materialSupplierPriceInsightService.listMaterialSupplierPriceHints(materialId);
    }

    @GetMapping
    public PageResponse<PurchaseOrderSummaryResponse> listPurchaseOrders(
            @RequestParam(required = false) String status,
            @RequestParam(name = "payment_status", required = false) String paymentStatus,
            @RequestParam(name = "supplier_id", required = false) UUID supplierId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return accountantPurchaseService.listPurchaseOrders(status, paymentStatus, supplierId, page, size);
    }

    @GetMapping("/{id}")
    public PurchaseOrderResponse getPurchaseOrder(@PathVariable UUID id) {
        return accountantPurchaseService.getPurchaseOrder(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseOrderResponse create(@Valid @RequestBody CreatePurchaseOrderRequest request) {
        return accountantPurchaseService.createPurchaseOrder(request);
    }

    @PatchMapping("/{id}/receive")
    public PurchaseOrderResponse receive(@PathVariable UUID id) {
        User accountant = securityUtils.getCurrentUser();
        return accountantPurchaseService.receive(id, accountant);
    }

    @PatchMapping("/{id}/pay")
    public PurchaseOrderResponse pay(@PathVariable UUID id, @Valid @RequestBody PayPurchaseRequest request) {
        return accountantPurchaseService.pay(id, request);
    }

    @PatchMapping("/{id}/cancel")
    public PurchaseOrderResponse cancel(@PathVariable UUID id) {
        return accountantPurchaseService.cancelPurchaseOrder(id);
    }
}
