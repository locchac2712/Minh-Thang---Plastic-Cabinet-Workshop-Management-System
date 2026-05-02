package com.tuplastic.erp.invoice.service;

import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.invoice.dto.InvoiceResponse;
import com.tuplastic.erp.invoice.entity.Invoice;
import com.tuplastic.erp.invoice.mapper.InvoiceMapper;
import com.tuplastic.erp.invoice.repository.InvoiceRepository;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SellerInvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;
    private final InvoiceMapper invoiceMapper;

    @Transactional(readOnly = true)
    public List<InvoiceResponse> listByOrder(UUID orderId, User seller) {
        orderRepository.findByIdAndCreatedById(orderId, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        return invoiceRepository.findByOrder_IdOrderByCreatedAtDesc(orderId).stream()
                .map(invoiceMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getById(UUID invoiceId, User seller) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Hóa đơn", "id", invoiceId));

        orderRepository.findByIdAndCreatedById(invoice.getOrder().getId(), seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hóa đơn", "id", invoiceId));

        return invoiceMapper.toResponse(invoice);
    }
}
