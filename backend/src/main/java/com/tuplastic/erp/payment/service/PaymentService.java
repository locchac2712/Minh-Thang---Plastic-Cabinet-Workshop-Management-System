package com.tuplastic.erp.payment.service;

import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.notification.service.NotificationService;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.order.service.OrderService;
import com.tuplastic.erp.payment.dto.CreatePaymentRequest;
import com.tuplastic.erp.payment.dto.PatchSellerPaymentRequest;
import com.tuplastic.erp.payment.dto.PaymentResponse;
import com.tuplastic.erp.payment.entity.Payment;
import com.tuplastic.erp.payment.mapper.PaymentMapper;
import com.tuplastic.erp.payment.repository.PaymentRepository;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.enums.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final AgencyRepository agencyRepository;
    private final PaymentMapper paymentMapper;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByOrder(UUID orderId, User seller) {
        orderRepository.findByIdAndCreatedById(orderId, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        return paymentRepository.findByOrderIdOrderByCreatedAtDesc(orderId)
                .stream()
                .map(paymentMapper::toResponse)
                .toList();
    }

    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request, User seller) {
        Agency agency = agencyRepository.findByIdAndAssignedSellerId(request.getAgencyId(), seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Đại lý", "id", request.getAgencyId()));

        Payment payment = Payment.builder()
                .agency(agency)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .proofImage(request.getProofImage())
                .note(request.getNote())
                .status("Pending")
                .build();

        if (StringUtils.hasText(request.getOrderId())) {
            UUID orderUuid = orderService.resolveSellerFulfillmentOrderId(request.getOrderId().trim(), seller);
            Order order = orderRepository.findById(orderUuid)
                    .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderUuid));
            if (!order.getAgency().getId().equals(agency.getId())) {
                throw new BadRequestException("Đơn hàng không thuộc đại lý đã chọn.");
            }
            BigDecimal remaining = order.getTotalPayable().subtract(order.getPaidAmount());
            if (request.getAmount().compareTo(remaining) > 0) {
                throw new BadRequestException(
                        String.format("Số tiền vượt quá số còn lại phải thu của đơn (%s).",
                                remaining.toPlainString()));
            }
            payment.setOrder(order);
        } else if (agency.getTotalDebt().compareTo(BigDecimal.ZERO) > 0
                && request.getAmount().compareTo(agency.getTotalDebt()) > 0) {
            throw new BadRequestException(
                    String.format("Phiếu thu không gắn đơn: số tiền không được vượt công nợ hiện tại (%s).",
                            agency.getTotalDebt().toPlainString()));
        }

        Payment saved = paymentRepository.save(payment);
        notificationService.notifyRoles(
                Set.of(UserRole.ACCOUNTANT),
                "PAYMENT_CONFIRM_REQUESTED",
                "Seller xac nhan thanh toan",
                String.format("Phieu thu %s can ke toan xac nhan.", shortPaymentId(saved)),
                "/accountant/payments?status=Pending",
                null,
                seller,
                null
        );
        return paymentMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> getPaymentsByAgency(UUID agencyId, String status, User seller, int page, int size) {
        agencyRepository.findByIdAndAssignedSellerId(agencyId, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Đại lý", "id", agencyId));

        String statusFilter = StringUtils.hasText(status) ? status.trim() : null;
        Pageable pageable = PageRequest.of(page, size);
        Page<Payment> paymentPage = paymentRepository.findByAgencyIdWithOptionalStatus(agencyId, statusFilter, pageable);

        return PageResponse.<PaymentResponse>builder()
                .content(paymentPage.getContent().stream().map(paymentMapper::toResponse).toList())
                .page(paymentPage.getNumber())
                .size(paymentPage.getSize())
                .totalElements(paymentPage.getTotalElements())
                .totalPages(paymentPage.getTotalPages())
                .last(paymentPage.isLast())
                .build();
    }

    @Transactional
    public PaymentResponse patchPendingPayment(UUID paymentId, PatchSellerPaymentRequest request, User seller) {
        if (request.getProofImage() == null && request.getNote() == null && request.getPaymentMethod() == null) {
            throw new BadRequestException("Cần ít nhất một trường: proofImage, note hoặc paymentMethod.");
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu thu", "id", paymentId));

        agencyRepository.findByIdAndAssignedSellerId(payment.getAgency().getId(), seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu thu", "id", paymentId));

        if (!"Pending".equals(payment.getStatus())) {
            throw new BadRequestException("Chỉ có thể sửa phiếu thu ở trạng thái Pending.");
        }

        if (request.getProofImage() != null) {
            payment.setProofImage(request.getProofImage());
        }
        if (request.getNote() != null) {
            payment.setNote(request.getNote());
        }
        if (request.getPaymentMethod() != null) {
            if (!StringUtils.hasText(request.getPaymentMethod())) {
                throw new BadRequestException("Phương thức thanh toán không được để trống.");
            }
            payment.setPaymentMethod(request.getPaymentMethod().trim());
        }

        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    private static String shortPaymentId(Payment payment) {
        String id = payment.getId().toString();
        return id.substring(0, 8);
    }
}
