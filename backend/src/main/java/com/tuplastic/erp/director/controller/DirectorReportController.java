package com.tuplastic.erp.director.controller;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.director.dto.*;
import com.tuplastic.erp.director.service.ReportService;
import com.tuplastic.erp.director.service.ReceivableWarningsService;
import com.tuplastic.erp.production.dto.ShopFloorPerformanceReport;
import com.tuplastic.erp.production.service.ShopFloorPerformanceService;
import com.tuplastic.erp.purchase.dto.MaterialSupplierPriceHint;
import com.tuplastic.erp.purchase.dto.OpenTaskMaterialNeedItem;
import com.tuplastic.erp.purchase.service.MaterialSupplierPriceInsightService;
import com.tuplastic.erp.purchase.service.OpenTaskMaterialRequirementService;
import com.tuplastic.erp.reconcile.DebtReconciliationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/director/reports")
@PreAuthorize("hasRole('DIRECTOR')")
@RequiredArgsConstructor
public class DirectorReportController {

    private final ReportService reportService;
    private final ShopFloorPerformanceService shopFloorPerformanceService;
    private final OpenTaskMaterialRequirementService openTaskMaterialRequirementService;
    private final MaterialSupplierPriceInsightService materialSupplierPriceInsightService;
    private final DebtReconciliationService debtReconciliationService;
    private final ReceivableWarningsService receivableWarningsService;

    @GetMapping("/revenue")
    public List<RevenueReportItem> getRevenueReport(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return reportService.getRevenueReport(fromDate, toDate);
    }

    @GetMapping("/open-task-material-needs")
    public List<OpenTaskMaterialNeedItem> getOpenTaskMaterialNeeds() {
        return openTaskMaterialRequirementService.listOpenTaskMaterialNeeds();
    }

    @GetMapping("/material-supplier-prices")
    public List<MaterialSupplierPriceHint> getMaterialSupplierPrices(
            @RequestParam(name = "material_id", required = false) UUID materialId) {
        return materialSupplierPriceInsightService.listMaterialSupplierPriceHints(materialId);
    }

    @GetMapping("/shop-floor")
    public ShopFloorPerformanceReport getShopFloorReport(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return shopFloorPerformanceService.getReport(fromDate, toDate);
    }

    @GetMapping("/gross-margin")
    public GrossMarginReport getGrossMarginReport(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return reportService.getGrossMarginReport(fromDate, toDate);
    }

    @GetMapping("/debts")
    public List<DebtReportItem> getAgencyDebts() {
        return reportService.getAgencyDebtsReport();
    }

    @GetMapping("/supplier-debts")
    public List<SupplierDebtReportItem> getSupplierDebts() {
        return reportService.getSupplierDebtsReport();
    }

    /** Đếm đại lý / NCC có total_debt âm (đối soát nhanh). */
    @GetMapping("/debt-sanity")
    public DebtReconciliationService.DebtSanitySnapshot getDebtSanity() {
        return debtReconciliationService.snapshotNegativeDebts();
    }

    /** Cảnh báo nợ phải thu (ước tính bucket / tuổi nợ theo quy ước, không có due_date cứng trong DB). */
    @GetMapping("/receivable-warnings/summary")
    public ReceivableWarningsSummaryDto getReceivableWarningsSummary(
            @RequestParam(name = "limit", required = false, defaultValue = "10") int topLimit,
            @RequestParam(required = false) String risk,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate today,
            @RequestParam(name = "only_active", required = false, defaultValue = "true") boolean onlyActive) {
        return receivableWarningsService.getSummary(topLimit, risk, today, onlyActive);
    }

    @GetMapping("/receivable-warnings/agencies")
    public PageResponse<ReceivableWarningsAgencyRowDto> listReceivableWarningAgencies(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String risk,
            @RequestParam(required = false) String bucket,
            @RequestParam(name = "min_overdue_days", required = false) Integer minOverdueDays,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate today,
            @RequestParam(name = "only_active", required = false, defaultValue = "true") boolean onlyActive,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return receivableWarningsService.listAgencies(
                search, risk, bucket, minOverdueDays, onlyActive, today, page, size);
    }

    @GetMapping("/receivable-warnings/agencies/{agencyId}")
    public ReceivableWarningsAgencyDetailDto getReceivableWarningAgencyDetail(
            @PathVariable UUID agencyId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate today) {
        return receivableWarningsService.getAgencyDetail(agencyId, today);
    }

    @GetMapping("/discount-allocations")
    public List<DiscountReportItem> getDiscountAllocations(
            @RequestParam(name = "from_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "to_date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return reportService.getDiscountAllocationsReport(fromDate, toDate);
    }
}
