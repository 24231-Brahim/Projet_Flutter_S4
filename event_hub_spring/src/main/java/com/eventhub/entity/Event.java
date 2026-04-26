package com.eventhub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "event_id", updatable = false, nullable = false)
    private String eventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organisateur_id", nullable = false)
    private User organisateur;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String categorie;

    @Column(name = "image_url")
    private String imageURL;

    @Column(nullable = false)
    private String lieu;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "date_debut", nullable = false)
    private LocalDateTime dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDateTime dateFin;

    @Column(name = "capacite_totale", nullable = false)
    private Integer capaciteTotale;

    @Column(name = "places_restantes", nullable = false)
    private Integer placesRestantes;

    @Column(name = "est_publie", nullable = false)
    @Builder.Default
    private Boolean estPublie = false;

    @Column(nullable = false)
    @Builder.Default
    private String statut = "draft";

    @ElementCollection
    @CollectionTable(name = "event_tags", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "tag")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Column(name = "average_rating")
    private Double averageRating;

    @Column(name = "review_count")
    private Integer reviewCount;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Ticket> tickets = new ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Review> reviews = new ArrayList<>();

    // Transient getters for Flutter model compatibility
    public boolean isPublished() {
        return estPublie != null && estPublie && "published".equals(statut);
    }

    public boolean isCancelled() {
        return "cancelled".equals(statut);
    }

    public boolean isCompleted() {
        return "completed".equals(statut);
    }

    public boolean isDraft() {
        return "draft".equals(statut);
    }

    public boolean isAvailable() {
        return isPublished() && placesRestantes != null && placesRestantes > 0;
    }

    public boolean isSoldOut() {
        return placesRestantes != null && placesRestantes <= 0;
    }

    public boolean isPast() {
        return dateFin != null && dateFin.isBefore(LocalDateTime.now());
    }

    public boolean isUpcoming() {
        return dateDebut != null && dateDebut.isAfter(LocalDateTime.now());
    }

    public double getOccupancyRate() {
        if (capaciteTotale == null || capaciteTotale == 0) return 0;
        return ((capaciteTotale - placesRestantes) / (double) capaciteTotale) * 100;
    }
}