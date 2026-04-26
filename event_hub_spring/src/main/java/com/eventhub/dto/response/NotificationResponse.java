package com.eventhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private String notifId;
    private String userId;
    private String titre;
    private String corps;
    private String type;
    private Map<String, String> data;
    private Boolean lue;
    private LocalDateTime envoyeAt;
    private Boolean isRead;
    private Boolean isBookingConfirmed;
    private Boolean isEventReminder;
    private Boolean isTicketReady;
    private Boolean isCancellation;
    private Boolean isPromotion;
}