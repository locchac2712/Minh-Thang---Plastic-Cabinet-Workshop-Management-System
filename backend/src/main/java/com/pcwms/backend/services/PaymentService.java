package com.pcwms.backend.services;

import com.pcwms.backend.config.PayOSClient;
import com.pcwms.backend.config.PayOSClient.*;
import com.pcwms.backend.dto.PaymentDTO;
import com.pcwms.backend.entity.Payment;
import com.pcwms.backend.entity.SalesOrder;
import com.pcwms.backend.repository.PaymentRepository;
import com.pcwms.backend.repository.SalesOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PayOSClient payOSClient;
    private final PaymentRepository    paymentRepository;
    private final SalesOrderRepository salesOrderRepository;

    @Value("${payos.return-url}")
    private String returnUrl;

    @Value("${payos.cancel-url}")
    private String cancelUrl;

    // ── Tạo link thanh toán PayOS ──────────────────────────────
    @Transactional
    public PaymentDTO.CreatePayOSResponse createPaymentLink(PaymentDTO.CreatePayOSRequest req) throws Exception {
        log.info("createPaymentLink: salesOrderId={}, amount={}, type={}",
                req.getSalesOrderId(), req.getAmount(), req.getPaymentType());

        SalesOrder salesOrder = salesOrderRepository.findByIdWithCustomer(req.getSalesOrderId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + req.getSalesOrderId()));

        long   orderCode   = generateOrderCode(req.getSalesOrderId());
        String description = buildDescription(req.getOrderNumber(), req.getPaymentType());

        // Build request cho PayOSClient
        CreateLinkRequest.Item item = new CreateLinkRequest.Item();
        item.setName(description);
        item.setQuantity(1);
        item.setPrice(req.getAmount().intValue());

        CreateLinkRequest linkReq = new CreateLinkRequest();
        linkReq.setOrderCode(orderCode);
        linkReq.setAmount(req.getAmount().intValue());
        linkReq.setDescription(description);
        linkReq.setBuyerName(req.getBuyerName());
        linkReq.setReturnUrl(returnUrl);
        linkReq.setCancelUrl(cancelUrl);
        linkReq.setItems(List.of(item));

        // Gọi PayOS — không còn crash với expiredAt nữa
        CreateLinkResponse response = payOSClient.createPaymentLink(linkReq);

        // Lưu Payment
        Payment payment = new Payment();
        payment.setSalesOrder(salesOrder);
        payment.setCustomer(salesOrder.getCustomer());
        payment.setAmount(BigDecimal.valueOf(req.getAmount()));
        payment.setTransactionDate(LocalDateTime.now());
        payment.setPaymentMethod("PAYOS");
        payment.setPayosPaymentType(req.getPaymentType());
        payment.setPayosPaymentLinkId(response.getPaymentLinkId());
        payment.setPayosOrderCode(orderCode);
        payment.setPayosCheckoutUrl(response.getCheckoutUrl());
        payment.setPayosQrCode(response.getQrCode());
        payment.setPayosStatus("PENDING");
        paymentRepository.save(payment);

        log.info("Payment saved | linkId={} | orderCode={}", response.getPaymentLinkId(), orderCode);

        PaymentDTO.CreatePayOSResponse res = new PaymentDTO.CreatePayOSResponse();
        res.setCheckoutUrl(response.getCheckoutUrl());
        res.setQrCode(response.getQrCode());
        res.setPaymentLinkId(response.getPaymentLinkId());
        res.setOrderCode(orderCode);
        return res;
    }

    // ── Polling trạng thái từ FE ───────────────────────────────
    public PaymentDTO.StatusResponse getPaymentStatus(String paymentLinkId) throws Exception {
        Payment payment = findByLinkIdOrThrow(paymentLinkId);

        if ("PAID".equals(payment.getPayosStatus())) {
            return toStatusResponse(payment);
        }

        PaymentStatusResponse info = payOSClient.getPaymentLinkInfo(payment.getPayosOrderCode());
        syncStatus(payment, info.getStatus());
        return toStatusResponse(payment);
    }

    // ── Huỷ link thanh toán ────────────────────────────────────
    @Transactional
    public void cancelPaymentLink(String paymentLinkId) throws Exception {
        Payment payment = findByLinkIdOrThrow(paymentLinkId);
        payOSClient.cancelPaymentLink(payment.getPayosOrderCode(), "Khách hàng huỷ");
        payment.setPayosStatus("CANCELLED");
        paymentRepository.save(payment);
        log.info("Cancelled PayOS link: {}", paymentLinkId);
    }

    // ── Xử lý Webhook PayOS ────────────────────────────────────
    @Transactional
    public void handleWebhook(PaymentDTO.WebhookPayload payload) {
        PaymentDTO.WebhookPayload.WebhookData d = payload.getData();

        // Verify signature
        WebhookData webhookData = new WebhookData();
        webhookData.setOrderCode(d.getOrderCode());
        webhookData.setAmount(d.getAmount());
        webhookData.setDescription(d.getDescription());
        webhookData.setAccountNumber(d.getAccountNumber());
        webhookData.setReference(d.getReference());
        webhookData.setTransactionDateTime(d.getTransactionDateTime());
        webhookData.setCurrency(d.getCurrency());
        webhookData.setPaymentLinkId(d.getPaymentLinkId());
        webhookData.setCode(d.getCode());
        webhookData.setDesc(d.getDesc());
        webhookData.setCounterAccountBankId(d.getCounterAccountBankId());
        webhookData.setCounterAccountBankName(d.getCounterAccountBankName());
        webhookData.setCounterAccountName(d.getCounterAccountName());
        webhookData.setCounterAccountNumber(d.getCounterAccountNumber());
        webhookData.setVirtualAccountName(d.getVirtualAccountName());
        webhookData.setVirtualAccountNumber(d.getVirtualAccountNumber());

        // ⚠️ Khi test local với Postman: comment dòng if bên dưới
        // ⚠️ Khi deploy production: bỏ comment để bật verify
         if (!payOSClient.verifyWebhookSignature(webhookData, payload.getSignature())) {
             log.warn("Webhook signature invalid!");
             return;
         }

        log.info("Webhook received | orderCode={} | code={}", d.getOrderCode(), payload.getCode());

        if (!"00".equals(payload.getCode())) {
            log.warn("Webhook non-success: code={}", payload.getCode());
            return;
        }

        paymentRepository.findByPayosOrderCode(d.getOrderCode())
                .ifPresentOrElse(
                        payment -> {
                            if ("PAID".equals(payment.getPayosStatus())) return;

                            // Đánh dấu giao dịch PayOS thành công
                            payment.setPayosStatus("PAID");
                            payment.setPayosPaidAt(LocalDateTime.now());
                            payment.setTransactionDate(LocalDateTime.now());
                            paymentRepository.save(payment);

                            // ── Cập nhật paymentStatus trên SalesOrder ──
                            // DEPOSIT → "DEPOSIT" (đặt cọc một phần)
                            // FULL    → "PAID"    (đã thanh toán đủ)
                            SalesOrder order = payment.getSalesOrder();
                            String newPaymentStatus = "DEPOSIT".equals(payment.getPayosPaymentType())
                                    ? "DEPOSIT"
                                    : "PAID";
                            order.setPaymentStatus(newPaymentStatus);
                            salesOrderRepository.save(order);

                            log.info("SalesOrder {} paymentStatus → {} | amount={}",
                                    order.getId(), newPaymentStatus, payment.getAmount());
                        },
                        () -> log.warn("Webhook: không tìm thấy payment với orderCode={}", d.getOrderCode())
                );
    }

    // ── Private helpers ────────────────────────────────────────

    private Payment findByLinkIdOrThrow(String paymentLinkId) {
        return paymentRepository.findByPayosPaymentLinkId(paymentLinkId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy payment: " + paymentLinkId));
    }


    @Transactional
    public void syncStatus(Payment payment, String payosStatus) {
        String newStatus = switch (payosStatus.toUpperCase()) {
            case "PAID"      -> "PAID";
            case "CANCELLED" -> "CANCELLED";
            case "EXPIRED"   -> "EXPIRED";
            default          -> "PENDING";
        };
        if (newStatus.equals(payment.getPayosStatus())) return;
        payment.setPayosStatus(newStatus);
        if ("PAID".equals(newStatus) && payment.getPayosPaidAt() == null) {
            payment.setPayosPaidAt(LocalDateTime.now());
        }
        paymentRepository.save(payment);
    }


    private PaymentDTO.StatusResponse toStatusResponse(Payment p) {
        PaymentDTO.StatusResponse res = new PaymentDTO.StatusResponse();
        res.setStatus(p.getPayosStatus());
        res.setAmount(p.getAmount().longValue());
        res.setPaidAt(p.getPayosPaidAt() != null
                ? p.getPayosPaidAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : null);
        return res;
    }


    private long generateOrderCode(Long salesOrderId) {
        long epoch = System.currentTimeMillis() / 1000 % 100000;
        String code = salesOrderId + String.format("%05d", epoch);
        return Long.parseLong(code.length() > 9 ? code.substring(code.length() - 9) : code);
    }


    private String buildDescription(String orderNumber, String paymentType) {
        String prefix = "DEPOSIT".equals(paymentType) ? "DC" : "TT";
        String raw    = prefix + " " + orderNumber;
        return raw.length() > 25 ? raw.substring(0, 25) : raw;
    }

}