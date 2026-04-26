package com.eventhub.dto.response;

import java.time.LocalDateTime;
import java.util.Map;

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

    public NotificationResponse() {}

    public String getNotifId() { return notifId; }
    public void setNotifId(String notifId) { this.notifId = notifId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }
    public String getCorps() { return corps; }
    public void setCorps(String corps) { this.corps = corps; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Map<String, String> getData() { return data; }
    public void setData(Map<String, String> data) { this.data = data; }
    public Boolean getLue() { return lue; }
    public void setLue(Boolean lue) { this.lue = lue; }
    public LocalDateTime getEnvoyeAt() { return envoyeAt; }
    public void setEnvoyeAt(LocalDateTime envoyeAt) { this.envoyeAt = envoyeAt; }
    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }
    public Boolean getIsBookingConfirmed() { return isBookingConfirmed; }
    public void setIsBookingConfirmed(Boolean isBookingConfirmed) { this.isBookingConfirmed = isBookingConfirmed; }
    public Boolean getIsEventReminder() { return isEventReminder; }
    public void setIsEventReminder(Boolean isEventReminder) { this.isEventReminder = isEventReminder; }
    public Boolean getIsTicketReady() { return isTicketReady; }
    public void setIsTicketReady(Boolean isTicketReady) { this.isTicketReady = isTicketReady; }
    public Boolean getIsCancellation() { return isCancellation; }
    public void setIsCancellation(Boolean isCancellation) { this.isCancellation = isCancellation; }
    public Boolean getIsPromotion() { return isPromotion; }
    public void setIsPromotion(Boolean isPromotion) { this.isPromotion = isPromotion; }
}