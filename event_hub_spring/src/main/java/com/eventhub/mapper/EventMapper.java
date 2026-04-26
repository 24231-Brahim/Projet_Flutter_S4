package com.eventhub.mapper;

import com.eventhub.dto.request.CreateEventRequest;
import com.eventhub.dto.request.UpdateEventRequest;
import com.eventhub.dto.response.EventResponse;
import com.eventhub.entity.Event;
import com.eventhub.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class EventMapper {

    public Event toEntity(CreateEventRequest request, User organisateur) {
        return Event.builder()
                .organisateur(organisateur)
                .titre(request.getTitre())
                .description(request.getDescription())
                .categorie(request.getCategorie())
                .imageURL(request.getImageURL() != null ? request.getImageURL() : "")
                .lieu(request.getLieu())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .capaciteTotale(request.getCapaciteTotale())
                .placesRestantes(request.getCapaciteTotale())
                .estPublie(false)
                .statut("draft")
                .tags(request.getTags() != null ? request.getTags() : List.of())
                .build();
    }

    public void updateEntity(Event event, UpdateEventRequest request) {
        if (request.getTitre() != null) {
            event.setTitre(request.getTitre());
        }
        if (request.getDescription() != null) {
            event.setDescription(request.getDescription());
        }
        if (request.getCategorie() != null) {
            event.setCategorie(request.getCategorie());
        }
        if (request.getImageURL() != null) {
            event.setImageURL(request.getImageURL());
        }
        if (request.getLieu() != null) {
            event.setLieu(request.getLieu());
        }
        if (request.getLatitude() != null) {
            event.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            event.setLongitude(request.getLongitude());
        }
        if (request.getDateDebut() != null) {
            event.setDateDebut(request.getDateDebut());
        }
        if (request.getDateFin() != null) {
            event.setDateFin(request.getDateFin());
        }
        if (request.getCapaciteTotale() != null) {
            event.setCapaciteTotale(request.getCapaciteTotale());
        }
        if (request.getTags() != null) {
            event.setTags(request.getTags());
        }
        if (request.getEstPublie() != null) {
            event.setEstPublie(request.getEstPublie());
        }
        if (request.getStatut() != null) {
            event.setStatut(request.getStatut());
        }
    }

    public EventResponse toResponse(Event event) {
        if (event == null) return null;

        return EventResponse.builder()
                .eventId(event.getEventId())
                .organisateurId(event.getOrganisateur() != null ? event.getOrganisateur().getUid() : null)
                .organisateurNom(event.getOrganisateur() != null ? event.getOrganisateur().getNom() : null)
                .titre(event.getTitre())
                .description(event.getDescription())
                .categorie(event.getCategorie())
                .imageURL(event.getImageURL())
                .lieu(event.getLieu())
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .dateDebut(event.getDateDebut())
                .dateFin(event.getDateFin())
                .capaciteTotale(event.getCapaciteTotale())
                .placesRestantes(event.getPlacesRestantes())
                .estPublie(event.getEstPublie())
                .statut(event.getStatut())
                .tags(event.getTags())
                .averageRating(event.getAverageRating())
                .reviewCount(event.getReviewCount())
                .isPublished(event.isPublished())
                .isCancelled(event.isCancelled())
                .isCompleted(event.isCompleted())
                .isDraft(event.isDraft())
                .isAvailable(event.isAvailable())
                .isSoldOut(event.isSoldOut())
                .isPast(event.isPast())
                .isUpcoming(event.isUpcoming())
                .occupancyRate(event.getOccupancyRate())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }

    public List<EventResponse> toResponses(List<Event> events) {
        return events.stream()
                .map(this::toResponse)
                .toList();
    }
}