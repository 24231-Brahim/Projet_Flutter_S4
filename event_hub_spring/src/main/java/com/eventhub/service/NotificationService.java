package com.eventhub.service;

import com.eventhub.dto.request.CreateNotificationRequest;
import com.eventhub.dto.response.NotificationResponse;
import com.eventhub.dto.response.PageResponse;
import com.eventhub.entity.Notification;
import com.eventhub.entity.User;
import com.eventhub.exception.ResourceNotFoundException;
import com.eventhub.mapper.NotificationMapper;
import com.eventhub.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserService userService;
    private final NotificationMapper notificationMapper;

    @Transactional
    public NotificationResponse createNotification(CreateNotificationRequest request) {
        log.info("Creating notification for user: {}", request.getUserId());

        User user = userService.getUserEntity(request.getUserId());

        Notification notification = notificationMapper.toEntity(request, user);
        notification = notificationRepository.save(notification);

        log.info("Notification created: {}", notification.getNotifId());
        return notificationMapper.toResponse(notification);
    }

    @Transactional(readOnly = true)
    public NotificationResponse getNotificationById(String notifId) {
        Notification notification = findNotificationById(notifId);
        return notificationMapper.toResponse(notification);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getUserNotifications(String userId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByUserUidOrderByEnvoyeAtDesc(userId, pageable);
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getUnreadNotifications(String userId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByUserUidAndLueFalseOrderByEnvoyeAtDesc(userId, pageable);
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String userId) {
        return notificationRepository.countUnreadByUser(userId);
    }

    @Transactional
    public NotificationResponse markAsRead(String notifId, String userId) {
        log.info("Marking notification as read: {} for user: {}", notifId, userId);

        Notification notification = findNotificationById(notifId);

        if (!notification.getUser().getUid().equals(userId)) {
            throw new ResourceNotFoundException("Notification non trouvée");
        }

        notification.setLue(true);
        notification = notificationRepository.save(notification);

        return notificationMapper.toResponse(notification);
    }

    @Transactional
    public void markAllAsRead(String userId) {
        log.info("Marking all notifications as read for user: {}", userId);
        notificationRepository.markAllAsRead(userId);
    }

    @Transactional
    public void deleteNotification(String notifId, String userId) {
        log.info("Deleting notification: {} for user: {}", notifId, userId);

        Notification notification = findNotificationById(notifId);

        if (!notification.getUser().getUid().equals(userId)) {
            throw new ResourceNotFoundException("Notification non trouvée");
        }

        notificationRepository.delete(notification);
        log.info("Notification deleted: {}", notifId);
    }

    @Transactional
    public void deleteAllUserNotifications(String userId) {
        log.info("Deleting all notifications for user: {}", userId);
        notificationRepository.deleteAllByUser(userId);
    }

    private Notification findNotificationById(String notifId) {
        return notificationRepository.findById(notifId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification non trouvée"));
    }

    private PageResponse<NotificationResponse> toPageResponse(Page<Notification> page) {
        return PageResponse.<NotificationResponse>builder()
                .content(notificationMapper.toResponses(page.getContent()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}