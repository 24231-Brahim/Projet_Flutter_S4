package com.eventhub.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ticket_id", updatable = false, nullable = false)
    private String ticketId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    @Column(nullable = false)
    @Builder.Default
    private String type = "standard";

    @Column(nullable = false)
    private Double prix;

    @Column(name = "quantite_disponible", nullable = false)
    private Integer quantiteDisponible;

    @Column(name = "quantite_vendue", nullable = false)
    @Builder.Default
    private Integer quantiteVendue = 0;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean actif = true;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Booking> bookings = new ArrayList<>();

    // Transient getters for Flutter model compatibility
    public boolean isAvailable() {
        return actif != null && actif && quantiteDisponible != null && quantiteDisponible > 0;
    }

    public boolean isSoldOut() {
        return quantiteDisponible != null && quantiteDisponible <= 0;
    }

    public boolean isStandard() {
        return "standard".equals(type);
    }

    public boolean isVip() {
        return "vip".equals(type);
    }

    public boolean isEarlyBird() {
        return "early_bird".equals(type);
    }

    public String getTypeDisplay() {
        return switch (type) {
            case "vip" -> "VIP";
            case "early_bird" -> "Early Bird";
            default -> "Standard";
        };
    }
}