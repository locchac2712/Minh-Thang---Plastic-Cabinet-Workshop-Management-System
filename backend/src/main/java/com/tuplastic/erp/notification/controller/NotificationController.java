package com.tuplastic.erp.notification.controller;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.security.SecurityUtils;
import com.tuplastic.erp.notification.dto.NotificationItemDto;
import com.tuplastic.erp.notification.dto.NotificationMarkAllReadDto;
import com.tuplastic.erp.notification.dto.NotificationUnreadCountDto;
import com.tuplastic.erp.notification.service.NotificationService;
import com.tuplastic.erp.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public PageResponse<NotificationItemDto> listMine(
            @RequestParam(name = "is_read", required = false) Boolean isRead,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        User me = securityUtils.getCurrentUser();
        return notificationService.listMine(me, isRead, page, size);
    }

    @GetMapping("/unread-count")
    public NotificationUnreadCountDto unreadCount() {
        User me = securityUtils.getCurrentUser();
        return notificationService.getUnreadCount(me);
    }

    @PatchMapping("/{id}/read")
    public NotificationItemDto markRead(@PathVariable("id") UUID notificationId) {
        User me = securityUtils.getCurrentUser();
        return notificationService.markRead(notificationId, me);
    }

    @PatchMapping("/read-all")
    public NotificationMarkAllReadDto markAllRead() {
        User me = securityUtils.getCurrentUser();
        return notificationService.markAllRead(me);
    }
}
