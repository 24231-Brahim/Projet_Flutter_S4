package com.eventhub.mapper;

import com.eventhub.dto.request.CreateNotificationRequest;
import com.eventhub.dto.response.NotificationResponse;
import com.eventhub.entity.Notification;
import com.eventhub.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class NotificationMapper {

    public Notification toEntity(CreateNotificationRequest request, User user) {
        return Notification.builder()
                .user(user)
                .titre(request.getTitre())
                .corps(request.getCorps())
                .type(request.getType())
                .data(request.getData() != null ? request.getData() : new java.util.HashMap<>())
                .lue(false)
                .build();
    }

    public NotificationResponse toResponse(Notification notification) {
        if (notification == null) return null;

        return NotificationResponse.builder()
                .notifId(notification.getNotifId())
                .userId(notification.getUser() != null ? notification.getUser().getUid() : null)
                .titre(notification.getTitre())
                .corps(notification.getCorps())
                .type(notification.getType())
                .data(notification.getData())
                .lue(notification.getLue())
                .envoyeAt(notification.getEnvoyeAt())
                .isRead(notification.isRead())
                .isBookingConfirmed(notification.isBookingConfirmed())
                .isEventReminder(notification.isEventReminder())
                .isTicketReady(notification.isTicketReady())
                .isCancellation(notification.isCancellation())
                .isPromotion(notification.isPromotion())
                .build();
    }

    public List<NotificationResponse> toResponses(List<Notification> notifications) {
        return notifications.stream()
                .map(this::toResponse)
                .toList();
    }
}