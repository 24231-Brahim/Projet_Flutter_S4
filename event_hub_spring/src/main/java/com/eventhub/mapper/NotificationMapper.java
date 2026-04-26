package com.eventhub.mapper;

import com.eventhub.dto.request.CreateNotificationRequest;
import com.eventhub.dto.response.NotificationResponse;
import com.eventhub.entity.Notification;
import com.eventhub.entity.User;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.List;

@Component
public class NotificationMapper {

    public Notification toEntity(CreateNotificationRequest request, User user) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitre(request.getTitre());
        notification.setCorps(request.getCorps());
        notification.setType(request.getType());
        notification.setData(request.getData() != null ? request.getData() : new HashMap<>());
        notification.setLue(false);
        return notification;
    }

    public NotificationResponse toResponse(Notification notification) {
        if (notification == null) return null;
        NotificationResponse response = new NotificationResponse();
        response.setNotifId(notification.getNotifId());
        response.setUserId(notification.getUser() != null ? notification.getUser().getUid() : null);
        response.setTitre(notification.getTitre());
        response.setCorps(notification.getCorps());
        response.setType(notification.getType());
        response.setData(notification.getData());
        response.setLue(notification.getLue());
        response.setEnvoyeAt(notification.getEnvoyeAt());
        response.setIsRead(notification.isRead());
        response.setIsBookingConfirmed(notification.isBookingConfirmed());
        response.setIsEventReminder(notification.isEventReminder());
        response.setIsTicketReady(notification.isTicketReady());
        response.setIsCancellation(notification.isCancellation());
        response.setIsPromotion(notification.isPromotion());
        return response;
    }

    public List<NotificationResponse> toResponses(List<Notification> notifications) {
        return notifications.stream().map(this::toResponse).toList();
    }
}