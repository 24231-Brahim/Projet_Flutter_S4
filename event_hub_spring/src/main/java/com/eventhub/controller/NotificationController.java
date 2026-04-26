package com.eventhub.controller;

import com.eventhub.dto.request.CreateNotificationRequest;
import com.eventhub.dto.response.ApiResponse;
import com.eventhub.dto.response.NotificationResponse;
import com.eventhub.dto.response.PageResponse;
import com.eventhub.security.service.CustomUserDetailsService;
import com.eventhub.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "Gestion des notifications")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;
    private final CustomUserDetailsService userDetailsService;

    public NotificationController(NotificationService notificationService, CustomUserDetailsService userDetailsService) {
        this.notificationService = notificationService;
        this.userDetailsService = userDetailsService;
    }

    @PostMapping
    @Operation(summary = "Créer une notification", description = "Créer une nouvelle notification (admin)")
    public ResponseEntity<ApiResponse<NotificationResponse>> createNotification(@RequestBody CreateNotificationRequest request) {
        NotificationResponse response = notificationService.createNotification(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Notification créée", response));
    }

    @GetMapping("/my")
    @Operation(summary = "Mes notifications", description = "Récupérer les notifications de l'utilisateur connecté")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        String userId = userDetailsService.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<NotificationResponse> response = notificationService.getUserNotifications(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/unread")
    @Operation(summary = "Notifications non lues", description = "Récupérer les notifications non lues")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getUnreadNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        String userId = userDetailsService.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<NotificationResponse> response = notificationService.getUnreadNotifications(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/unread/count")
    @Operation(summary = "Nombre de notifications non lues", description = "Récupérer le nombre de notifications non lues")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        String userId = userDetailsService.getCurrentUserId();
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    @PutMapping("/{notifId}/read")
    @Operation(summary = "Marquer comme lu", description = "Marquer une notification comme lue")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(@PathVariable String notifId) {
        String userId = userDetailsService.getCurrentUserId();
        NotificationResponse response = notificationService.markAsRead(notifId, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/read-all")
    @Operation(summary = "Tout marquer comme lu", description = "Marquer toutes les notifications comme lues")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        String userId = userDetailsService.getCurrentUserId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success("Toutes les notifications marquées comme lues", null));
    }

    @DeleteMapping("/{notifId}")
    @Operation(summary = "Supprimer une notification", description = "Supprimer une notification")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable String notifId) {
        String userId = userDetailsService.getCurrentUserId();
        notificationService.deleteNotification(notifId, userId);
        return ResponseEntity.ok(ApiResponse.success("Notification supprimée", null));
    }

    @DeleteMapping("/clear")
    @Operation(summary = "Supprimer toutes les notifications", description = "Supprimer toutes les notifications de l'utilisateur")
    public ResponseEntity<ApiResponse<Void>> deleteAllNotifications() {
        String userId = userDetailsService.getCurrentUserId();
        notificationService.deleteAllUserNotifications(userId);
        return ResponseEntity.ok(ApiResponse.success("Toutes les notifications supprimées", null));
    }
}