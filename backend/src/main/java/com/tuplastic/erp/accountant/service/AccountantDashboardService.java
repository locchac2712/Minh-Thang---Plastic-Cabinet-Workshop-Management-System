package com.tuplastic.erp.accountant.service;

import com.tuplastic.erp.accountant.dto.AccountantDashboardResponse;
import com.tuplastic.erp.invoice.repository.InvoiceRepository;
import com.tuplastic.erp.material.repository.MaterialRepository;
import com.tuplastic.erp.payment.repository.PaymentRepository;
import com.tuplastic.erp.purchase.repository.PurchaseOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccountantDashboardService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final MaterialRepository materialRepository;

    public AccountantDashboardResponse getDashboard() {
        return AccountantDashboardResponse.builder()
                .pendingPaymentCount(paymentRepository.countByStatus("Pending"))
                .draftInvoiceCount(invoiceRepository.countByStatus("Draft"))
                .purchaseOrdersPendingReceiveCount(purchaseOrderRepository.countByStatus("Pending"))
                .purchaseOrdersWithOpenPaymentCount(purchaseOrderRepository.countWithOpenPaymentObligation())
                .lowStockMaterialCount(materialRepository.countLowStockActive())
                .build();
    }
}
