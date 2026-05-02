package com.tuplastic.erp.accountant.service;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.invoice.dto.*;
import com.tuplastic.erp.invoice.entity.Invoice;
import com.tuplastic.erp.invoice.mapper.InvoiceMapper;
import com.tuplastic.erp.invoice.repository.InvoiceRepository;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Year;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountantInvoiceService {

    private static final List<String> BLOCKING_INVOICE_STATUSES = List.of("Draft", "Issued");
    private static final Set<String> INVOICE_LIST_STATUSES = Set.of("Draft", "Issued", "Canceled");

    private final OrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceMapper invoiceMapper;

    @Transactional(readOnly = true)
    public PageResponse<InvoiceResponse> listInvoices(String status, UUID orderId, int page, int size) {
        String statusFilter = normalizeInvoiceListStatus(status);
        Pageable pageable = PageRequest.of(page, size);
        Page<Invoice> invoicePage = invoiceRepository.findForAccountant(statusFilter, orderId, pageable);

        return PageResponse.<InvoiceResponse>builder()
                .content(invoicePage.getContent().stream().map(invoiceMapper::toResponse).toList())
                .page(invoicePage.getNumber())
                .size(invoicePage.getSize())
                .totalElements(invoicePage.getTotalElements())
                .totalPages(invoicePage.getTotalPages())
                .last(invoicePage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(UUID id) {
        Invoice invoice = findInvoiceOrThrow(id);
        return invoiceMapper.toResponse(invoice);
    }

    @Transactional(readOnly = true)
    public PageResponse<EligibleOrderForInvoiceResponse> listEligibleOrders(
            String orderStatusParam, Boolean invoiced, int page, int size) {
        OrderStatus orderStatus = parseOrderStatus(orderStatusParam);
        boolean invoicedFilter = invoiced != null && invoiced;

        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orderPage = orderRepository.findForInvoicing(orderStatus, invoicedFilter, pageable);

        return PageResponse.<EligibleOrderForInvoiceResponse>builder()
                .content(orderPage.getContent().stream().map(this::toEligibleRow).toList())
                .page(orderPage.getNumber())
                .size(orderPage.getSize())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .last(orderPage.isLast())
                .build();
    }

    @Transactional
    public InvoiceCreatedResponse createDraft(CreateInvoiceRequest request) {
        validateVatRate(request.getVatRate());

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", request.getOrderId()));

        if (order.getStatus() != OrderStatus.Done) {
            throw new BadRequestException(
                    String.format("Chỉ lập hóa đơn cho đơn ở trạng thái Done. Đơn hiện tại: %s",
                            order.getStatus()));
        }

        if (invoiceRepository.existsByOrder_IdAndStatusIn(request.getOrderId(), BLOCKING_INVOICE_STATUSES)) {
            throw new BadRequestException(
                    "Đơn đã có hóa đơn Draft hoặc Issued. Hủy hóa đơn cũ trước khi tạo mới (nếu được phép).");
        }

        BigDecimal subTotal = order.getTotalPayable();
        BigDecimal vatAmount = subTotal
                .multiply(request.getVatRate())
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subTotal.add(vatAmount);

        Invoice invoice = Invoice.builder()
                .order(order)
                .subTotal(subTotal)
                .vatRate(request.getVatRate())
                .vatAmount(vatAmount)
                .totalAmount(totalAmount)
                .status("Draft")
                .build();

        Invoice saved = invoiceRepository.save(invoice);
        return InvoiceCreatedResponse.builder()
                .id(saved.getId())
                .status(saved.getStatus())
                .build();
    }

    @Transactional
    public InvoiceResponse markIssued(UUID invoiceId, IssueInvoiceRequest request) {
        Invoice invoice = findInvoiceOrThrow(invoiceId);
        assertInvoiceStatus(invoice, "Draft", "phát hành");

        invoice.setInvoiceFileUrl(request.getInvoiceFileUrl().trim());

        if (!StringUtils.hasText(invoice.getInvoiceNumber())) {
            long seq = invoiceRepository.nextInvoiceNumberSequenceValue();
            int year = Year.now(ZoneId.of("Asia/Ho_Chi_Minh")).getValue();
            invoice.setInvoiceNumber(String.format("INV-%d-%010d", year, seq));
        }

        invoice.setStatus("Issued");
        return invoiceMapper.toResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceResponse cancel(UUID invoiceId, CancelInvoiceRequest request) {
        Invoice invoice = findInvoiceOrThrow(invoiceId);

        if ("Canceled".equals(invoice.getStatus())) {
            throw new BadRequestException("Hóa đơn đã ở trạng thái Canceled.");
        }
        if (!"Draft".equals(invoice.getStatus()) && !"Issued".equals(invoice.getStatus())) {
            throw new BadRequestException("Chỉ hủy được hóa đơn Draft hoặc Issued.");
        }

        invoice.setStatus("Canceled");
        if (request != null && StringUtils.hasText(request.getNote())) {
            invoice.setNote(request.getNote().trim());
        }

        return invoiceMapper.toResponse(invoiceRepository.save(invoice));
    }

    private Invoice findInvoiceOrThrow(UUID id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hóa đơn", "id", id));
    }

    private void assertInvoiceStatus(Invoice invoice, String expected, String action) {
        if (!expected.equals(invoice.getStatus())) {
            throw new BadRequestException(
                    String.format("Không thể %s: hóa đơn đang '%s', yêu cầu '%s'",
                            action, invoice.getStatus(), expected));
        }
    }

    private void validateVatRate(BigDecimal rate) {
        if (rate == null) {
            throw new BadRequestException("Thuế suất VAT không được để trống.");
        }
        BigDecimal n = rate.stripTrailingZeros();
        boolean ok = n.compareTo(new BigDecimal("8")) == 0 || n.compareTo(new BigDecimal("10")) == 0;
        if (!ok) {
            throw new BadRequestException("Thuế suất VAT chỉ chấp nhận 8%% hoặc 10%%.");
        }
    }

    private String normalizeInvoiceListStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        String trimmed = status.trim();
        if (!INVOICE_LIST_STATUSES.contains(trimmed)) {
            throw new BadRequestException(
                    String.format("Tham số 'status' không hợp lệ: '%s'. Chấp nhận: %s",
                            trimmed, String.join(", ", INVOICE_LIST_STATUSES)));
        }
        return trimmed;
    }

    private OrderStatus parseOrderStatus(String param) {
        if (param == null || param.isBlank()) {
            return OrderStatus.Done;
        }
        try {
            return OrderStatus.valueOf(param.trim());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("order_status không hợp lệ: " + param);
        }
    }

    private EligibleOrderForInvoiceResponse toEligibleRow(Order o) {
        return EligibleOrderForInvoiceResponse.builder()
                .id(o.getId())
                .agencyId(o.getAgency().getId())
                .agencyName(o.getAgency().getName())
                .totalPayable(o.getTotalPayable())
                .paidAmount(o.getPaidAmount())
                .status(o.getStatus().name())
                .createdAt(o.getCreatedAt())
                .build();
    }
}
