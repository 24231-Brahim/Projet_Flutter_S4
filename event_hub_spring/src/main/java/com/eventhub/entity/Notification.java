package com.eventhub.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "notifications")
@EntityListeners(AuditingEntityListener.class)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "notif_id", updatable = false, nullable = false)
    private String notifId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", nullable = false)
    private User user;

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String corps;

    @Column(nullable = false)
    private String type;

    @ElementCollection
    @CollectionTable(name = "notification_data", joinColumns = @JoinColumn(name = "notif_id"))
    @MapKeyColumn(name = "data_key")
    @Column(name = "data_value")
    private Map<String, String> data = new HashMap<>();

    @Column(nullable = false)
    private Boolean lue = false;

    @CreatedDate
    @Column(name = "envoye_at", nullable = false, updatable = false)
    private LocalDateTime envoyeAt;

    public Notification() {}

    public String getNotifId() { return notifId; }
    public void setNotifId(String notifId) { this.notifId = notifId; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
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

    public boolean isRead() { return lue != null && lue; }
    public boolean isBookingConfirmed() { return "booking_confirmed".equals(type); }
    public boolean isEventReminder() { return "event_reminder".equals(type); }
    public boolean isTicketReady() { return "ticket_ready".equals(type); }
    public boolean isCancellation() { return "cancellation".equals(type); }
    public boolean isPromotion() { return "promotion".equals(type); }
}