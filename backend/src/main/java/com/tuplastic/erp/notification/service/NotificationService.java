package com.tuplastic.erp.notification.service;

import com.tuplastic.erp.common.dto.PageResponse;
import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.notification.dto.NotificationItemDto;
import com.tuplastic.erp.notification.dto.NotificationMarkAllReadDto;
import com.tuplastic.erp.notification.dto.NotificationUnreadCountDto;
import com.tuplastic.erp.notification.entity.Notification;
import com.tuplastic.erp.notification.entity.UserNotification;
import com.tuplastic.erp.notification.repository.NotificationRepository;
import com.tuplastic.erp.notification.repository.UserNotificationRepository;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.enums.UserRole;
import com.tuplastic.erp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void notifyUsers(List<User> recipients,
                            String type,
                            String title,
                            String body,
                            String targetUrl,
                            String eventKey,
                            User createdBy,
                            String metaJson) {
        Set<UUID> recipientIds = recipients.stream()
                .filter(u -> u != null && Boolean.TRUE.equals(u.getIsActive()))
                .map(User::getId)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        if (recipientIds.isEmpty()) {
            return;
        }

        Notification notification = null;
        if (StringUtils.hasText(eventKey)) {
            notification = notificationRepository.findByEventKey(eventKey.trim()).orElse(null);
        }

        if (notification == null) {
            notification = Notification.builder()
                    .type(type)
                    .title(title)
                    .body(body)
                    .targetUrl(targetUrl)
                    .eventKey(StringUtils.hasText(eventKey) ? eventKey.trim() : null)
                    .metaJson(metaJson)
                    .createdBy(createdBy)
                    .build();
            notification = notificationRepository.save(notification);
        }

        Notification finalNotification = notification;
        for (UUID uid : recipientIds) {
            if (userNotificationRepository.existsByNotification_IdAndUser_Id(finalNotification.getId(), uid)) {
                continue;
            }
            User recipientRef = userRepository.getReferenceById(uid);
            userNotificationRepository.save(UserNotification.builder()
                    .notification(finalNotification)
                    .user(recipientRef)
                    .isRead(false)
                    .build());
        }
    }

    @Transactional
    public void notifyUser(User recipient,
                           String type,
                           String title,
                           String body,
                           String targetUrl,
                           String eventKey,
                           User createdBy,
                           String metaJson) {
        notifyUsers(List.of(recipient), type, title, body, targetUrl, eventKey, createdBy, metaJson);
    }

    @Transactional
    public void notifyRoles(Set<UserRole> roles,
                            String type,
                            String title,
                            String body,
                            String targetUrl,
                            String eventKey,
                            User createdBy,
                            String metaJson) {
        Set<User> recipients = new LinkedHashSet<>();
        for (UserRole role : roles) {
            recipients.addAll(userRepository.findByRoleAndIsActiveTrueOrderByFullNameAsc(role));
        }
        notifyUsers(List.copyOf(recipients), type, title, body, targetUrl, eventKey, createdBy, metaJson);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationItemDto> listMine(User me, Boolean isRead, int page, int size) {
        int p = Math.max(0, page);
        int sz = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(p, sz, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<UserNotification> pg = isRead == null
                ? userNotificationRepository.findByUser_Id(me.getId(), pageable)
                : userNotificationRepository.findByUser_IdAndIsRead(me.getId(), isRead, pageable);

        return PageResponse.<NotificationItemDto>builder()
                .content(pg.getContent().stream().map(this::toItem).toList())
                .page(pg.getNumber())
                .size(pg.getSize())
                .totalElements(pg.getTotalElements())
                .totalPages(pg.getTotalPages())
                .last(pg.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public NotificationUnreadCountDto getUnreadCount(User me) {
        long count = userNotificationRepository.countByUser_IdAndIsRead(me.getId(), false);
        return new NotificationUnreadCountDto(count);
    }

    @Transactional
    public NotificationItemDto markRead(UUID notificationId, User me) {
        UserNotification row = userNotificationRepository.findByNotification_IdAndUser_Id(notificationId, me.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Thông báo", "id", notificationId));
        if (!row.isRead()) {
            row.setRead(true);
            row.setReadAt(LocalDateTime.now());
            row = userNotificationRepository.save(row);
        }
        return toItem(row);
    }

    @Transactional
    public NotificationMarkAllReadDto markAllRead(User me) {
        int updated = userNotificationRepository.markAllReadByUserId(me.getId(), LocalDateTime.now());
        return new NotificationMarkAllReadDto(updated);
    }

    private NotificationItemDto toItem(UserNotification row) {
        Notification n = row.getNotification();
        return NotificationItemDto.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .body(n.getBody())
                .targetUrl(n.getTargetUrl())
                .metaJson(n.getMetaJson())
                .createdAt(row.getCreatedAt())
                .isRead(row.isRead())
                .readAt(row.getReadAt())
                .build();
    }
}
