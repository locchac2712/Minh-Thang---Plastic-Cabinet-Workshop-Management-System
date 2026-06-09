package com.tuplastic.erp.notification.scheduler;

import com.tuplastic.erp.activitylog.repository.ActivityLogRepository;
import com.tuplastic.erp.inventory.repository.InventoryLogRepository;
import com.tuplastic.erp.material.entity.Material;
import com.tuplastic.erp.material.repository.MaterialRepository;
import com.tuplastic.erp.notification.service.NotificationService;
import com.tuplastic.erp.order.entity.Order;
import com.tuplastic.erp.order.enums.OrderStatus;
import com.tuplastic.erp.order.repository.OrderRepository;
import com.tuplastic.erp.production.entity.ProductionTask;
import com.tuplastic.erp.production.repository.ProductionTaskRepository;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.enums.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");

    private final NotificationService notificationService;
    private final MaterialRepository materialRepository;
    private final OrderRepository orderRepository;
    private final ProductionTaskRepository productionTaskRepository;
    private final ActivityLogRepository activityLogRepository;
    private final InventoryLogRepository inventoryLogRepository;

    @Value("${app.notifications.payment-deadline-days:3}")
    private int paymentDeadlineDays;

    @Value("${app.receivables.warning.due-grace-days:30}")
    private int dueGraceDays;

    @Value("${app.notifications.shift-end-hour:17}")
    private int shiftEndHour;

    @Scheduled(cron = "${app.notifications.low-stock-cron:0 0 * * * *}", zone = "Asia/Ho_Chi_Minh")
    public void notifyLowStockMaterials() {
        LocalDate today = LocalDate.now(VN);
        List<Material> lowStocks = materialRepository.findLowStock();
        for (Material material : lowStocks) {
            String body = String.format(
                    "Nguyen vat lieu %s hien chi con %s. Vui long kiem tra va nhap hang.",
                    material.getName(), material.getStockQuantity().toPlainString());
            String baseKey = "low-stock:" + material.getId() + ":" + today;

            notificationService.notifyRoles(
                    Set.of(UserRole.ACCOUNTANT),
                    "LOW_STOCK_ALERT",
                    "Canh bao ton kho thap",
                    body,
                    "/accountant/purchases/low-stock-alerts",
                    baseKey + ":accountant",
                    null,
                    null
            );
            notificationService.notifyRoles(
                    Set.of(UserRole.DIRECTOR),
                    "LOW_STOCK_ALERT",
                    "Canh bao ton kho thap",
                    body,
                    "/director/reports/open-task-material-needs",
                    baseKey + ":director",
                    null,
                    null
            );
        }
    }

    @Scheduled(cron = "${app.notifications.deadline-cron:0 0 8 * * *}", zone = "Asia/Ho_Chi_Minh")
    public void notifyPaymentDeadlines() {
        LocalDate today = LocalDate.now(VN);
        List<Order> doneOrders = orderRepository.findByStatus(OrderStatus.Done);
        for (Order order : doneOrders) {
            BigDecimal remaining = order.getTotalPayable().subtract(order.getPaidAmount());
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            if (order.getCreatedBy() == null || !Boolean.TRUE.equals(order.getCreatedBy().getIsActive())) {
                continue;
            }
            LocalDate anchorDate = resolveAnchorDate(order);
            LocalDate dueDate = anchorDate.plusDays(dueGraceDays);
            long daysUntilDue = ChronoUnit.DAYS.between(today, dueDate);
            if (daysUntilDue < 0 || daysUntilDue > paymentDeadlineDays) {
                continue;
            }

            String eventKey = "payment-deadline:" + order.getId() + ":" + dueDate;
            String body = String.format(
                    "Don %s sap den han thanh toan (%s). Con phai thu %s.",
                    shortOrderId(order), dueDate, remaining.toPlainString());
            notificationService.notifyUser(
                    order.getCreatedBy(),
                    "PAYMENT_DEADLINE_NEAR",
                    "Nhac han thanh toan don hang",
                    body,
                    "/seller/orders/" + order.getId(),
                    eventKey,
                    null,
                    null
            );
        }
    }

    @Scheduled(cron = "${app.notifications.shift-check-cron:0 5 17 * * *}", zone = "Asia/Ho_Chi_Minh")
    public void notifyMissingProductionLogsAfterShift() {
        LocalDate today = LocalDate.now(VN);
        LocalDateTime now = LocalDateTime.now(VN);
        if (now.toLocalTime().isBefore(LocalTime.of(shiftEndHour, 0))) {
            return;
        }

        List<ProductionTask> doingTasks = productionTaskRepository.findByStatus("Doing");
        LocalDateTime from = today.atStartOfDay();
        LocalDateTime to = today.plusDays(1).atStartOfDay();
        for (ProductionTask task : doingTasks) {
            User assignee = task.getAssignedTo();
            if (assignee == null || !Boolean.TRUE.equals(assignee.getIsActive())) {
                continue;
            }
            boolean hasActivityLog = activityLogRepository.existsByTaskIdAndCreatedAtBetween(task.getId(), from, to);
            boolean hasInventoryLog = inventoryLogRepository.existsByTaskIdAndCreatedAtBetween(task.getId(), from, to);
            if (hasActivityLog || hasInventoryLog) {
                continue;
            }

            String eventKey = "missing-log:" + task.getId() + ":" + today;
            String body = String.format(
                    "Lenh SX %s chua co ghi nhan nhat ky NVL trong ca hom nay.",
                    shortTaskId(task));
            notificationService.notifyUser(
                    assignee,
                    "MISSING_SHIFT_LOG",
                    "Nhac ghi nhan nhat ky NVL",
                    body,
                    "/production/tasks/" + task.getId() + "/logs",
                    eventKey,
                    null,
                    null
            );
        }
    }

    private static String shortOrderId(Order order) {
        String id = order.getId().toString();
        return id.substring(0, 8);
    }

    private static String shortTaskId(ProductionTask task) {
        String id = task.getId().toString();
        return id.substring(0, 8);
    }

    private static LocalDate resolveAnchorDate(Order order) {
        if (order.getExpectedDeliveryDate() != null) {
            return order.getExpectedDeliveryDate();
        }
        if (order.getUpdatedAt() != null) {
            return order.getUpdatedAt().atZone(VN).toLocalDate();
        }
        if (order.getCreatedAt() != null) {
            return order.getCreatedAt().atZone(VN).toLocalDate();
        }
        return LocalDate.now(VN);
    }
}
