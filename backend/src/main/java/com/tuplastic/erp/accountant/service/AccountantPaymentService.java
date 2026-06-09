package com.tuplastic.erp.accountant.service;

import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.agency.repository.AgencyRepository;
import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.notification.service.NotificationService;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.payment.dto.PaymentResponse;
import com.tuplastic.erp.payment.dto.RejectPaymentRequest;
import com.tuplastic.erp.payment.entity.Payment;
import com.tuplastic.erp.payment.mapper.PaymentMapper;
import com.tuplastic.erp.payment.repository.PaymentRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountantPaymentService {

    private static final Set<String> PAYMENT_STATUSES = Set.of("Pending", "Completed", "Failed");

    private final PaymentRepository paymentRepository;
    private final AgencyRepository agencyRepository;
    private final OrderRepository orderRepository;
    private final PaymentMapper paymentMapper;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> listPayments(
            String status,
            UUID agencyId,
            UUID orderId,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BadRequestException("Tham số from không được sau to.");
        }

        String filter = resolveStatusFilter(status);
        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime toExclusive = toDate != null ? toDate.plusDays(1).atStartOfDay() : null;

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Payment> paymentPage = paymentRepository.findAll(
                buildListSpec(filter, agencyId, orderId, from, toExclusive),
                pageable);

        return PageResponse.<PaymentResponse>builder()
                .content(paymentPage.getContent().stream().map(paymentMapper::toResponse).toList())
                .page(paymentPage.getNumber())
                .size(paymentPage.getSize())
                .totalElements(paymentPage.getTotalElements())
                .totalPages(paymentPage.getTotalPages())
                .last(paymentPage.isLast())
                .build();
    }

    /**
     * Chốt phiếu thu: Completed — trừ công nợ đại lý, cộng paid_amount đơn (nếu có order).
     */
    @Transactional
    public PaymentResponse approvePayment(UUID paymentId, RejectPaymentRequest request) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu thu", "id", paymentId));

        assertPending(payment, "duyệt");

        Agency agency = payment.getAgency();
        /*
         * Phiếu không gắn đơn: ràng buộc theo tổng nợ ghi nhận trên đại lý.
         * Phiếu gắn đơn: seller chỉ được tạo tới phần còn lại của đơn; tổng nợ đại lý có thể
         * nhỏ hơn (vd. đã trừ bởi các phiếu thu không gắn đơn trước đó). Tránh reject oan.
         */
        if (payment.getOrder() == null
                && payment.getAmount().compareTo(agency.getTotalDebt()) > 0) {
            throw new BadRequestException(
                    String.format("Số tiền duyệt (%s) vượt công nợ đại lý hiện tại (%s).",
                            payment.getAmount().toPlainString(),
                            agency.getTotalDebt().toPlainString()));
        }

        if (payment.getOrder() != null) {
            Order order = payment.getOrder();
            BigDecimal afterPaid = order.getPaidAmount().add(payment.getAmount());
            if (afterPaid.compareTo(order.getTotalPayable()) > 0) {
                throw new BadRequestException(
                        String.format("Sau duyệt, tổng thu trên đơn (%s) vượt tổng phải trả của đơn (%s).",
                                afterPaid.toPlainString(),
                                order.getTotalPayable().toPlainString()));
            }
        }

        BigDecimal newDebt = agency.getTotalDebt().subtract(payment.getAmount());
        if (newDebt.compareTo(BigDecimal.ZERO) < 0) {
            newDebt = BigDecimal.ZERO;
        }
        agency.setTotalDebt(newDebt);
        agencyRepository.save(agency);

        if (payment.getOrder() != null) {
            Order order = payment.getOrder();
            order.setPaidAmount(order.getPaidAmount().add(payment.getAmount()));
            orderRepository.save(order);
        }

        payment.setStatus("Completed");
        if (request != null && StringUtils.hasText(request.getNote())) {
            String prefix = "Duyệt kế toán: ";
            String existing = payment.getNote();
            payment.setNote(existing == null || existing.isBlank()
                    ? prefix + request.getNote().trim()
                    : existing + " | " + prefix + request.getNote().trim());
        }
        Payment saved = paymentRepository.save(payment);
        if (saved.getAgency().getAssignedSeller() != null) {
            notificationService.notifyUser(
                    saved.getAgency().getAssignedSeller(),
                    "PAYMENT_APPROVED",
                    "Thanh toan duoc xac nhan",
                    String.format("Phieu thu %s da duoc ke toan xac nhan.", shortPaymentId(saved)),
                    "/seller/agencies/" + saved.getAgency().getId() + "/payments",
                    null,
                    null,
                    null
            );
        }
        return paymentMapper.toResponse(saved);
    }

    @Transactional
    public PaymentResponse rejectPayment(UUID paymentId, RejectPaymentRequest request) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu thu", "id", paymentId));

        assertPending(payment, "từ chối");

        payment.setStatus("Failed");
        if (request != null && StringUtils.hasText(request.getNote())) {
            String prefix = "Từ chối kế toán: ";
            String existing = payment.getNote();
            payment.setNote(existing == null || existing.isBlank()
                    ? prefix + request.getNote().trim()
                    : existing + " | " + prefix + request.getNote().trim());
        }

        Payment saved = paymentRepository.save(payment);
        if (saved.getAgency().getAssignedSeller() != null) {
            notificationService.notifyUser(
                    saved.getAgency().getAssignedSeller(),
                    "PAYMENT_REJECTED",
                    "Thanh toan bi huy",
                    String.format("Phieu thu %s bi tu choi boi ke toan.", shortPaymentId(saved)),
                    "/seller/agencies/" + saved.getAgency().getId() + "/payments",
                    null,
                    null,
                    null
            );
        }
        return paymentMapper.toResponse(saved);
    }

    private void assertPending(Payment payment, String action) {
        if (!"Pending".equals(payment.getStatus())) {
            throw new BadRequestException(
                    String.format("Không thể %s: phiếu thu đang ở trạng thái '%s', chỉ xử lý được khi 'Pending'",
                            action, payment.getStatus()));
        }
    }

    /** null = không lọc trạng thái (tất cả). */
    private String resolveStatusFilter(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        String normalized = status.trim();
        if (!PAYMENT_STATUSES.contains(normalized)) {
            throw new BadRequestException(
                    "Trạng thái không hợp lệ. Chấp nhận: Pending, Completed, Failed");
        }
        return normalized;
    }

    /**
     * Build dynamic predicates; chỉ thêm điều kiện khi param non-null để tránh bind NULL
     * vào JPQL (Postgres từng báo "could not determine data type of parameter $N").
     */
    private Specification<Payment> buildListSpec(
            String status,
            UUID agencyId,
            UUID orderId,
            LocalDateTime from,
            LocalDateTime toExclusive) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (agencyId != null) {
                predicates.add(cb.equal(root.get("agency").get("id"), agencyId));
            }
            if (orderId != null) {
                predicates.add(cb.equal(root.get("order").get("id"), orderId));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<LocalDateTime>get("createdAt"), from));
            }
            if (toExclusive != null) {
                predicates.add(cb.lessThan(root.<LocalDateTime>get("createdAt"), toExclusive));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static String shortPaymentId(Payment payment) {
        String id = payment.getId().toString();
        return id.substring(0, 8);
    }
}
