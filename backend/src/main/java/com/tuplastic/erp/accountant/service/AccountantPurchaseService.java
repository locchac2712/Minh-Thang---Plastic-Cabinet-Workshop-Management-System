package com.tuplastic.erp.accountant.service;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.inventory.entity.InventoryLog;
import com.tuplastic.erp.inventory.repository.InventoryLogRepository;
import com.tuplastic.erp.material.dto.MaterialSupplierItem;
import com.tuplastic.erp.material.entity.Material;
import com.tuplastic.erp.material.repository.MaterialRepository;
import com.tuplastic.erp.supplier.entity.Supplier;
import com.tuplastic.erp.purchase.dto.*;
import com.tuplastic.erp.purchase.entity.PurchaseOrder;
import com.tuplastic.erp.purchase.entity.PurchaseOrderItem;
import com.tuplastic.erp.purchase.repository.PurchaseOrderRepository;
import com.tuplastic.erp.supplier.repository.SupplierRepository;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountantPurchaseService {

    private static final Set<String> PURCHASE_ORDER_STATUSES = Set.of("Pending", "Received", "Canceled");
    private static final Set<String> PURCHASE_PAYMENT_STATUSES = Set.of("Unpaid", "Partial", "Paid");

    private final MaterialRepository materialRepository;
    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final InventoryLogRepository inventoryLogRepository;

    @Transactional(readOnly = true)
    public PageResponse<PurchaseOrderSummaryResponse> listPurchaseOrders(
            String status,
            String paymentStatus,
            UUID supplierId,
            int page,
            int size) {
        String statusFilter = normalizeOptionalFilter(status, PURCHASE_ORDER_STATUSES, "status");
        String paymentFilter = normalizeOptionalFilter(paymentStatus, PURCHASE_PAYMENT_STATUSES, "payment_status");
        Pageable pageable = PageRequest.of(page, size);
        Page<PurchaseOrderSummaryResponse> result = purchaseOrderRepository.findSummariesForAccountant(
                statusFilter, paymentFilter, supplierId, pageable);

        return PageResponse.<PurchaseOrderSummaryResponse>builder()
                .content(result.getContent())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse getPurchaseOrder(UUID id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn mua hàng", "id", id));
        return toResponse(po);
    }

    @Transactional(readOnly = true)
    public List<LowStockMaterialAlertResponse> getLowStockAlerts() {
        return materialRepository.findLowStockWithSuppliers().stream()
                .sorted(Comparator.comparing(Material::getStockQuantity))
                .map(m -> LowStockMaterialAlertResponse.builder()
                        .id(m.getId())
                        .code(m.getCode())
                        .name(m.getName())
                        .unit(m.getUnit())
                        .stockQuantity(m.getStockQuantity())
                        .minStockLevel(m.getMinStockLevel())
                        .suppliers(toSupplierItems(m.getSuppliers()))
                        .build())
                .toList();
    }

    private static List<MaterialSupplierItem> toSupplierItems(Set<Supplier> suppliers) {
        if (suppliers == null || suppliers.isEmpty()) {
            return List.of();
        }
        return suppliers.stream()
                .map(s -> MaterialSupplierItem.builder().id(s.getId()).name(s.getName()).build())
                .sorted(Comparator.comparing(MaterialSupplierItem::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional
    public PurchaseOrderResponse createPurchaseOrder(CreatePurchaseOrderRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Nhà cung cấp", "id", request.getSupplierId()));
        if (Boolean.FALSE.equals(supplier.getIsActive())) {
            throw new BadRequestException("Nhà cung cấp '" + supplier.getName() + "' đang bị khóa (inactive).");
        }

        BigDecimal computedTotal = BigDecimal.ZERO;
        List<PurchaseOrderItem> lines = new ArrayList<>();

        PurchaseOrder po = PurchaseOrder.builder()
                .supplier(supplier)
                .status("Pending")
                .paymentStatus("Unpaid")
                .paidAmount(BigDecimal.ZERO)
                .build();

        for (CreatePurchaseLineRequest line : request.getItems()) {
            Material material = materialRepository.findById(line.getMaterialId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vật tư", "id", line.getMaterialId()));
            if (Boolean.FALSE.equals(material.getIsActive())) {
                throw new BadRequestException("Vật tư '" + material.getName() + "' đang bị khóa (inactive).");
            }
            if (!materialRepository.existsSupplierMaterialLink(supplier.getId(), material.getId())) {
                throw new BadRequestException(
                        "Vật tư '" + material.getName() + "' chưa được gán cho NCC '"
                                + supplier.getName()
                                + "'. Vui lòng cập nhật danh mục NCC–NVL trước khi lập PO.");
            }

            BigDecimal lineTotal = line.getQuantity().multiply(line.getUnitPrice())
                    .setScale(4, RoundingMode.HALF_UP);
            computedTotal = computedTotal.add(lineTotal);

            PurchaseOrderItem item = PurchaseOrderItem.builder()
                    .purchaseOrder(po)
                    .material(material)
                    .quantity(line.getQuantity())
                    .unitPrice(line.getUnitPrice())
                    .build();
            lines.add(item);
        }

        computedTotal = computedTotal.setScale(4, RoundingMode.HALF_UP);
        if (computedTotal.compareTo(request.getTotalAmount()) != 0) {
            throw new BadRequestException(
                    String.format("Tổng tiền (%s) không khớp tổng các dòng hàng (%s).",
                            request.getTotalAmount().toPlainString(),
                            computedTotal.toPlainString()));
        }

        po.setTotalAmount(computedTotal);
        po.getItems().addAll(lines);

        PurchaseOrder saved = purchaseOrderRepository.save(po);

        supplier.setTotalDebt(supplier.getTotalDebt().add(computedTotal));
        supplierRepository.save(supplier);

        return toResponse(saved);
    }

    @Transactional
    public PurchaseOrderResponse receive(UUID purchaseOrderId, User currentUser) {
        PurchaseOrder po = purchaseOrderRepository.findById(purchaseOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn mua hàng", "id", purchaseOrderId));

        if (!"Pending".equals(po.getStatus())) {
            throw new BadRequestException(
                    String.format("Chỉ nhận hàng khi PO đang Pending. Trạng thái hiện tại: %s", po.getStatus()));
        }

        for (PurchaseOrderItem line : po.getItems()) {
            Material material = line.getMaterial();
            BigDecimal inQty = line.getQuantity();
            BigDecimal unitPrice = line.getUnitPrice();

            BigDecimal oldQty = material.getStockQuantity();
            BigDecimal oldCost = material.getUnitCost() != null ? material.getUnitCost() : BigDecimal.ZERO;
            BigDecimal newQty = oldQty.add(inQty);

            BigDecimal newUnitCost;
            if (newQty.compareTo(BigDecimal.ZERO) == 0) {
                newUnitCost = BigDecimal.ZERO;
            } else if (oldQty.compareTo(BigDecimal.ZERO) == 0) {
                newUnitCost = unitPrice.setScale(4, RoundingMode.HALF_UP);
            } else {
                BigDecimal valueOld = oldQty.multiply(oldCost);
                BigDecimal valueIn = inQty.multiply(unitPrice);
                newUnitCost = valueOld.add(valueIn)
                        .divide(newQty, 4, RoundingMode.HALF_UP);
            }

            material.setStockQuantity(newQty);
            material.setUnitCost(newUnitCost);
            materialRepository.save(material);

            InventoryLog log = InventoryLog.builder()
                    .material(material)
                    .purchaseId(po.getId())
                    .createdBy(currentUser)
                    .transactionType("IMPORT")
                    .quantityChange(inQty)
                    .unitPriceAtTime(unitPrice)
                    .note("Nhập kho từ PO #" + po.getId().toString().substring(0, 8))
                    .build();
            inventoryLogRepository.save(log);
        }

        po.setStatus("Received");
        return toResponse(purchaseOrderRepository.save(po));
    }

    @Transactional
    public PurchaseOrderResponse pay(UUID purchaseOrderId, PayPurchaseRequest request) {
        PurchaseOrder po = purchaseOrderRepository.findById(purchaseOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn mua hàng", "id", purchaseOrderId));

        if ("Canceled".equals(po.getStatus())) {
            throw new BadRequestException("Không thể thanh toán đơn đã hủy.");
        }

        BigDecimal remaining = po.getTotalAmount().subtract(po.getPaidAmount());
        if (request.getPaidAmount().compareTo(remaining) > 0) {
            throw new BadRequestException(
                    String.format("Số tiền vượt quá còn lại phải trả (%s).",
                            remaining.toPlainString()));
        }

        Supplier supplier = po.getSupplier();
        BigDecimal payDelta = request.getPaidAmount();
        po.setPaidAmount(po.getPaidAmount().add(payDelta));

        if (po.getPaidAmount().compareTo(po.getTotalAmount()) >= 0) {
            po.setPaymentStatus("Paid");
        } else {
            po.setPaymentStatus("Partial");
        }

        BigDecimal newDebt = supplier.getTotalDebt().subtract(payDelta);
        if (newDebt.compareTo(BigDecimal.ZERO) < 0) {
            newDebt = BigDecimal.ZERO;
        }
        supplier.setTotalDebt(newDebt);

        supplierRepository.save(supplier);
        return toResponse(purchaseOrderRepository.save(po));
    }

    /**
     * Hủy PO đang Pending, chưa thanh toán: giảm công nợ NCC tương ứng tổng PO.
     */
    @Transactional
    public PurchaseOrderResponse cancelPurchaseOrder(UUID purchaseOrderId) {
        PurchaseOrder po = purchaseOrderRepository.findById(purchaseOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn mua hàng", "id", purchaseOrderId));

        if (!"Pending".equals(po.getStatus())) {
            throw new BadRequestException(
                    String.format("Chỉ hủy PO đang Pending. Trạng thái hiện tại: %s", po.getStatus()));
        }
        if (po.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            throw new BadRequestException("Không hủy PO khi đã có thanh toán.");
        }

        Supplier supplier = po.getSupplier();
        BigDecimal newDebt = supplier.getTotalDebt().subtract(po.getTotalAmount());
        if (newDebt.compareTo(BigDecimal.ZERO) < 0) {
            newDebt = BigDecimal.ZERO;
        }
        supplier.setTotalDebt(newDebt);
        supplierRepository.save(supplier);

        po.setStatus("Canceled");
        return toResponse(purchaseOrderRepository.save(po));
    }

    private String normalizeOptionalFilter(String value, Set<String> allowed, String paramName) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        if (!allowed.contains(trimmed)) {
            throw new BadRequestException(
                    String.format("Tham số '%s' không hợp lệ: '%s'. Chấp nhận: %s",
                            paramName, trimmed, String.join(", ", allowed)));
        }
        return trimmed;
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder po) {
        List<PurchaseOrderItemResponse> itemResponses = po.getItems().stream()
                .map(this::toItemResponse)
                .toList();

        return PurchaseOrderResponse.builder()
                .id(po.getId())
                .supplierId(po.getSupplier().getId())
                .supplierName(po.getSupplier().getName())
                .totalAmount(po.getTotalAmount())
                .paidAmount(po.getPaidAmount())
                .paymentStatus(po.getPaymentStatus())
                .status(po.getStatus())
                .items(itemResponses)
                .createdAt(po.getCreatedAt())
                .updatedAt(po.getUpdatedAt())
                .build();
    }

    private PurchaseOrderItemResponse toItemResponse(PurchaseOrderItem item) {
        Material m = item.getMaterial();
        BigDecimal lineTotal = item.getQuantity().multiply(item.getUnitPrice())
                .setScale(4, RoundingMode.HALF_UP);
        return PurchaseOrderItemResponse.builder()
                .id(item.getId())
                .materialId(m.getId())
                .materialCode(m.getCode())
                .materialName(m.getName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .lineTotal(lineTotal)
                .build();
    }
}
