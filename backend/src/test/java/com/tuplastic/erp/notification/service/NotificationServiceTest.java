package com.tuplastic.erp.notification.service;

import com.tuplastic.erp.common.exception.ResourceNotFoundException;
import com.tuplastic.erp.notification.dto.NotificationMarkAllReadDto;
import com.tuplastic.erp.notification.entity.Notification;
import com.tuplastic.erp.notification.entity.UserNotification;
import com.tuplastic.erp.notification.repository.NotificationRepository;
import com.tuplastic.erp.notification.repository.UserNotificationRepository;
import com.tuplastic.erp.user.entity.User;
import com.tuplastic.erp.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private UserNotificationRepository userNotificationRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void notifyUsers_dedupesByEventKey() {
        UUID userId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        User user = User.builder().isActive(true).build();
        user.setId(userId);

        Notification existing = Notification.builder().build();
        existing.setId(UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));

        when(notificationRepository.findByEventKey("event-1"))
                .thenReturn(Optional.of(existing));
        when(userNotificationRepository.existsByNotification_IdAndUser_Id(existing.getId(), userId))
                .thenReturn(true);

        notificationService.notifyUsers(
                List.of(user),
                "LOW_STOCK_ALERT",
                "Canh bao ton kho thap",
                "Body",
                "/x",
                "event-1",
                null,
                null
        );

        verify(notificationRepository).findByEventKey("event-1");
        verify(userNotificationRepository).existsByNotification_IdAndUser_Id(existing.getId(), userId);
    }

    @Test
    void markRead_throwsWhenNotificationNotOwnedByUser() {
        UUID notificationId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID userId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        User me = User.builder().build();
        me.setId(userId);

        when(userNotificationRepository.findByNotification_IdAndUser_Id(notificationId, userId))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> notificationService.markRead(notificationId, me));
    }

    @Test
    void markAllRead_returnsUpdatedCount() {
        UUID userId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        User me = User.builder().build();
        me.setId(userId);

        when(userNotificationRepository.markAllReadByUserId(eq(userId), any())).thenReturn(5);

        NotificationMarkAllReadDto rs = notificationService.markAllRead(me);

        assertEquals(5, rs.getUpdatedCount());
        verify(userNotificationRepository).markAllReadByUserId(eq(userId), any());
    }
}
