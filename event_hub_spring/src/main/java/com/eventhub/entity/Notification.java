package com.eventhub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "notifications")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    @Builder.Default
    private Map<String, String> data = new HashMap<>();

    @Column(nullable = false)
    @Builder.Default
    private Boolean lue = false;

    @CreatedDate
    @Column(name = "envoye_at", nullable = false, updatable = false)
    private LocalDateTime envoyeAt;

    // Transient getters for Flutter model compatibility
    public boolean isRead() {
        return lue != null && lue;
    }

    public boolean isBookingConfirmed() {
        return "booking_confirmed".equals(type);
    }

    public boolean isEventReminder() {
        return "event_reminder".equals(type);
    }

    public boolean isTicketReady() {
        return "ticket_ready".equals(type);
    }

    public boolean isCancellation() {
        return "cancellation".equals(type);
    }

    public boolean isPromotion() {
        return "promotion".equals(type);
    }
}