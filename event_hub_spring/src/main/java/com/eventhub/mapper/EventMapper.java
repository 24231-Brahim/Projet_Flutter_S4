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
        Event event = new Event();
        event.setOrganisateur(organisateur);
        event.setTitre(request.getTitre());
        event.setDescription(request.getDescription());
        event.setCategorie(request.getCategorie());
        event.setImageURL(request.getImageURL() != null ? request.getImageURL() : "");
        event.setLieu(request.getLieu());
        event.setLatitude(request.getLatitude());
        event.setLongitude(request.getLongitude());
        event.setDateDebut(request.getDateDebut());
        event.setDateFin(request.getDateFin());
        event.setCapaciteTotale(request.getCapaciteTotale());
        event.setPlacesRestantes(request.getCapaciteTotale());
        event.setEstPublie(false);
        event.setStatut("draft");
        event.setTags(request.getTags() != null ? request.getTags() : List.of());
        return event;
    }

    public void updateEntity(Event event, UpdateEventRequest request) {
        if (request.getTitre() != null) event.setTitre(request.getTitre());
        if (request.getDescription() != null) event.setDescription(request.getDescription());
        if (request.getCategorie() != null) event.setCategorie(request.getCategorie());
        if (request.getImageURL() != null) event.setImageURL(request.getImageURL());
        if (request.getLieu() != null) event.setLieu(request.getLieu());
        if (request.getLatitude() != null) event.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) event.setLongitude(request.getLongitude());
        if (request.getDateDebut() != null) event.setDateDebut(request.getDateDebut());
        if (request.getDateFin() != null) event.setDateFin(request.getDateFin());
        if (request.getCapaciteTotale() != null) event.setCapaciteTotale(request.getCapaciteTotale());
        if (request.getTags() != null) event.setTags(request.getTags());
        if (request.getEstPublie() != null) event.setEstPublie(request.getEstPublie());
        if (request.getStatut() != null) event.setStatut(request.getStatut());
    }

    public EventResponse toResponse(Event event) {
        if (event == null) return null;
        EventResponse response = new EventResponse();
        response.setEventId(event.getEventId());
        response.setOrganisateurId(event.getOrganisateur() != null ? event.getOrganisateur().getUid() : null);
        response.setOrganisateurNom(event.getOrganisateur() != null ? event.getOrganisateur().getNom() : null);
        response.setTitre(event.getTitre());
        response.setDescription(event.getDescription());
        response.setCategorie(event.getCategorie());
        response.setImageURL(event.getImageURL());
        response.setLieu(event.getLieu());
        response.setLatitude(event.getLatitude());
        response.setLongitude(event.getLongitude());
        response.setDateDebut(event.getDateDebut());
        response.setDateFin(event.getDateFin());
        response.setCapaciteTotale(event.getCapaciteTotale());
        response.setPlacesRestantes(event.getPlacesRestantes());
        response.setEstPublie(event.getEstPublie());
        response.setStatut(event.getStatut());
        response.setTags(event.getTags());
        response.setAverageRating(event.getAverageRating());
        response.setReviewCount(event.getReviewCount());
        response.setIsPublished(event.isPublished());
        response.setIsCancelled(event.isCancelled());
        response.setIsCompleted(event.isCompleted());
        response.setIsDraft(event.isDraft());
        response.setIsAvailable(event.isAvailable());
        response.setIsSoldOut(event.isSoldOut());
        response.setIsPast(event.isPast());
        response.setIsUpcoming(event.isUpcoming());
        response.setOccupancyRate(event.getOccupancyRate());
        response.setCreatedAt(event.getCreatedAt());
        response.setUpdatedAt(event.getUpdatedAt());
        return response;
    }

    public List<EventResponse> toResponses(List<Event> events) {
        return events.stream().map(this::toResponse).toList();
    }
}