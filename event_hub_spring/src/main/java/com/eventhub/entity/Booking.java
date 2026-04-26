package com.eventhub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "booking_id", updatable = false, nullable = false)
    private String bookingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Column(nullable = false)
    private Integer quantite;

    @Column(name = "montant_total", nullable = false)
    private Double montantTotal;

    @Column(nullable = false)
    @Builder.Default
    private String devise = "USD";

    @Column(nullable = false)
    @Builder.Default
    private String statut = "pending";

    @Column(name = "qr_code_token")
    private String qrCodeToken;

    @Column(name = "qr_code_url")
    private String qrCodeURL;

    @Column(name = "pdf_url")
    private String pdfURL;

    @Column(name = "payment_id")
    private String paymentId;

    @Column(name = "scanned_at")
    private LocalDateTime scannedAt;

    @CreatedDate
    @Column(name = "date_reservation", nullable = false, updatable = false)
    private LocalDateTime dateReservation;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Transient getters for Flutter model compatibility
    public boolean isPending() {
        return "pending".equals(statut);
    }

    public boolean isConfirmed() {
        return "confirmed".equals(statut);
    }

    public boolean isCancelled() {
        return "cancelled".equals(statut);
    }

    public boolean isRefunded() {
        return "refunded".equals(statut);
    }

    public boolean isUsed() {
        return "used".equals(statut);
    }

    public boolean isScanned() {
        return scannedAt != null;
    }
}