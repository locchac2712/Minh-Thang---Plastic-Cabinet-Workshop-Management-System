package com.tuplastic.erp.production.service;

import com.tuplastic.erp.activitylog.entity.ActivityLog;
import com.tuplastic.erp.activitylog.repository.ActivityLogRepository;
import com.tuplastic.erp.agency.entity.Agency;
import com.tuplastic.erp.common.exception.BadRequestException;
import com.tuplastic.erp.common.exception.BusinessLogicException;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.order.util.OrderPhaseUtils;
import com.tuplastic.erp.product.entity.Product;
import com.tuplastic.erp.production.dto.PublicTaskTrackResponse;
import com.tuplastic.erp.production.dto.TaskShareLinkResponse;
import com.tuplastic.erp.production.entity.ProductionTask;
import com.tuplastic.erp.production.entity.ProductionTaskTrackingToken;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.production.repository.ProductionTaskTrackingTokenRepository;
import com.tuplastic.erp.production.util.ProductionTaskDisplayCodeUtils;
import com.tuplastic.erp.security.util.TokenHashUtils;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskTrackingService {

    public static final String INVALID_TOKEN_MESSAGE =
            "Liên kết không hợp lệ hoặc đã hết hạn";

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final ProductionTaskTrackingTokenRepository trackingTokenRepository;
    private final ProductionTaskRepository productionTaskRepository;
    private final OrderRepository orderRepository;
    private final ActivityLogRepository activityLogRepository;

    @Value("${app.task-tracking.token-validity-ms:7776000000}")
    private long tokenValidityMs;

    @Value("${app.task-tracking.frontend-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Transactional
    public TaskShareLinkResponse createOrGetShareLink(UUID orderId, UUID taskId, User seller) {
        Order order = orderRepository.findByIdAndCreatedById(orderId, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        if (OrderPhaseUtils.isQuotationPhase(order.getStatus())) {
            throw new BusinessLogicException(
                    "Đơn đang ở giai đoạn báo giá — chưa thể chia sẻ tiến độ sản xuất.");
        }

        ProductionTask task = productionTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Lệnh sản xuất", "id", taskId));

        if (task.getOrder() == null || !orderId.equals(task.getOrder().getId())) {
            throw new BadRequestException("Lệnh sản xuất không thuộc đơn hàng này.");
        }

        LocalDateTime now = LocalDateTime.now(ZONE);
        trackingTokenRepository.revokeActiveByTaskId(taskId, now);

        String plainToken = generateSecureToken();
        String tokenHash = TokenHashUtils.sha256Hex(plainToken);
        LocalDateTime expiresAt = now.plus(Duration.ofMillis(tokenValidityMs));

        ProductionTaskTrackingToken row = ProductionTaskTrackingToken.builder()
                .task(task)
                .createdBy(seller)
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .build();
        trackingTokenRepository.save(row);

        return TaskShareLinkResponse.builder()
                .url(buildPublicUrl(plainToken))
                .expiresAt(expiresAt)
                .revoked(false)
                .build();
    }

    private String buildPublicUrl(String tokenSegment) {
        String base = frontendBaseUrl == null ? "" : frontendBaseUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + "/track/" + tokenSegment;
    }

    @Transactional(readOnly = true)
    public PublicTaskTrackResponse getByPlainToken(String plainToken) {
        String trimmed = plainToken == null ? "" : plainToken.trim();
        if (!StringUtils.hasText(trimmed)) {
            throw new BadRequestException(INVALID_TOKEN_MESSAGE);
        }

        String hash = TokenHashUtils.sha256Hex(trimmed);
        ProductionTaskTrackingToken row = trackingTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new BadRequestException(INVALID_TOKEN_MESSAGE));

        LocalDateTime now = LocalDateTime.now(ZONE);
        if (row.getRevokedAt() != null || row.getExpiresAt().isBefore(now)) {
            throw new BadRequestException(INVALID_TOKEN_MESSAGE);
        }

        ProductionTask task = row.getTask();
        Order order = task.getOrder();
        if (order == null || OrderPhaseUtils.isQuotationPhase(order.getStatus())) {
            throw new BadRequestException(INVALID_TOKEN_MESSAGE);
        }

        return toPublicResponse(task, order);
    }

    @Transactional
    public void revokeShareLink(UUID orderId, UUID taskId, User seller) {
        orderRepository.findByIdAndCreatedById(orderId, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));

        ProductionTask task = productionTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Lệnh sản xuất", "id", taskId));

        if (task.getOrder() == null || !orderId.equals(task.getOrder().getId())) {
            throw new BadRequestException("Lệnh sản xuất không thuộc đơn hàng này.");
        }

        trackingTokenRepository.revokeActiveByTaskId(taskId, LocalDateTime.now(ZONE));
    }

    private PublicTaskTrackResponse toPublicResponse(ProductionTask task, Order order) {
        Product product = task.getProduct();
        Agency agency = order.getAgency();
        String agencyName = agency != null && StringUtils.hasText(agency.getName())
                ? agency.getName().trim()
                : "Khách hàng";

        List<PublicTaskTrackResponse.PublicActivityLogEntry> logs =
                activityLogRepository.findByTaskIdOrderByCreatedAtAsc(task.getId()).stream()
                        .map(this::toPublicLog)
                        .toList();

        String shipping = order.getShippingAddress() != null ? order.getShippingAddress().trim() : null;
        if (shipping != null && shipping.isEmpty()) {
            shipping = null;
        }
        String deliveryPoint = task.getDeliveryAddress() != null ? task.getDeliveryAddress().trim() : null;
        if (deliveryPoint != null && deliveryPoint.isEmpty()) {
            deliveryPoint = null;
        }
        String proofUrl = task.getDeliveryProofImageUrl() != null ? task.getDeliveryProofImageUrl().trim() : null;
        if (proofUrl != null && proofUrl.isEmpty()) {
            proofUrl = null;
        }

        return PublicTaskTrackResponse.builder()
                .productName(product != null ? product.getName() : "Sản phẩm")
                .quantity(task.getQuantity())
                .status(task.getStatus())
                .expectedEndDate(task.getExpectedEndDate() != null ? task.getExpectedEndDate().toString() : null)
                .completedAt(task.getCompletedAt())
                .deliveredAt(task.getDeliveredAt())
                .taskDisplayCode(ProductionTaskDisplayCodeUtils.displayRef(task.getDisplayCode(), task.getId()))
                .agencyDisplayName(agencyName)
                .orderShippingAddress(shipping)
                .deliveryAddress(deliveryPoint)
                .deliveryProofImageUrl(proofUrl)
                .deliverable("Done".equals(task.getStatus()) && task.getDeliveredAt() == null)
                .orderStatus(order.getStatus() != null ? order.getStatus().name() : null)
                .activityLogs(logs)
                .build();
    }

    private PublicTaskTrackResponse.PublicActivityLogEntry toPublicLog(ActivityLog log) {
        return PublicTaskTrackResponse.PublicActivityLogEntry.builder()
                .description(log.getDescription())
                .imageUrl(log.getImageUrl())
                .createdAt(log.getCreatedAt())
                .userDisplayName("Xưởng")
                .build();
    }

    private static String generateSecureToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
