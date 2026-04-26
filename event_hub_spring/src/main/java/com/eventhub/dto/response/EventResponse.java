package com.eventhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventResponse {

    private String eventId;
    private String organisateurId;
    private String organisateurNom;
    private String titre;
    private String description;
    private String categorie;
    private String imageURL;
    private String lieu;
    private Double latitude;
    private Double longitude;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private Integer capaciteTotale;
    private Integer placesRestantes;
    private Boolean estPublie;
    private String statut;
    private List<String> tags;
    private Double averageRating;
    private Integer reviewCount;
    private Boolean isPublished;
    private Boolean isCancelled;
    private Boolean isCompleted;
    private Boolean isDraft;
    private Boolean isAvailable;
    private Boolean isSoldOut;
    private Boolean isPast;
    private Boolean isUpcoming;
    private Double occupancyRate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}