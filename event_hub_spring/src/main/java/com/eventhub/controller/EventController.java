package com.eventhub.controller;

import com.eventhub.dto.request.CreateEventRequest;
import com.eventhub.dto.request.UpdateEventRequest;
import com.eventhub.dto.response.ApiResponse;
import com.eventhub.dto.response.EventResponse;
import com.eventhub.dto.response.EventWithTicketsResponse;
import com.eventhub.dto.response.PageResponse;
import com.eventhub.security.service.CustomUserDetailsService;
import com.eventhub.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
@Tag(name = "Events", description = "Gestion des événements")
public class EventController {

    private final EventService eventService;
    private final CustomUserDetailsService userDetailsService;

    @GetMapping
    @Operation(summary = "Liste des événements", description = "Récupérer une liste paginée d'événements publiés")
    public ResponseEntity<ApiResponse<PageResponse<EventResponse>>> getEvents(
            @Parameter(description = "Numéro de page") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de page") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Trier par") @RequestParam(defaultValue = "dateDebut") String sortBy,
            @Parameter(description = "Direction du tri") @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        PageResponse<EventResponse> response = eventService.getPublishedEvents(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/categories")
    @Operation(summary = "Catégories", description = "Récupérer toutes les catégories d'événements")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        List<String> categories = eventService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Événements à venir", description = "Récupérer les événements à venir")
    public ResponseEntity<ApiResponse<PageResponse<EventResponse>>> getUpcomingEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateDebut").ascending());
        PageResponse<EventResponse> response = eventService.getUpcomingEvents(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/past")
    @Operation(summary = "Événements passés", description = "Récupérer les événements passés")
    public ResponseEntity<ApiResponse<PageResponse<EventResponse>>> getPastEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateFin").descending());
        PageResponse<EventResponse> response = eventService.getPastEvents(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/search")
    @Operation(summary = "Rechercher des événements", description = "Rechercher des événements par mot-clé")
    public ResponseEntity<ApiResponse<PageResponse<EventResponse>>> searchEvents(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateDebut").descending());
        PageResponse<EventResponse> response = eventService.searchEvents(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Événements par catégorie", description = "Récupérer les événements d'une catégorie")
    public ResponseEntity<ApiResponse<PageResponse<EventResponse>>> getEventsByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateDebut").descending());
        PageResponse<EventResponse> response = eventService.getEventsByCategory(category, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{eventId}")
    @Operation(summary = "Détail événement", description = "Récupérer les détails d'un événement")
    public ResponseEntity<ApiResponse<EventResponse>> getEventById(
            @PathVariable String eventId
    ) {
        EventResponse response = eventService.getEventById(eventId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{eventId}/full")
    @Operation(summary = "Événement avec tickets", description = "Récupérer un événement avec ses tickets")
    public ResponseEntity<ApiResponse<EventWithTicketsResponse>> getEventWithTickets(
            @PathVariable String eventId
    ) {
        EventWithTicketsResponse response = eventService.getEventWithTickets(eventId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Protected endpoints below

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Créer un événement", description = "Créer un nouvel événement")
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateEventRequest request
    ) {
        String userId = userDetailsService.getCurrentUserId();
        EventResponse response = eventService.createEvent(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Événement créé", response));
    }

    @PutMapping("/{eventId}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Modifier un événement", description = "Mettre à jour un événement")
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateEventRequest request
    ) {
        String userId = userDetailsService.getCurrentUserId();
        EventResponse response = eventService.updateEvent(eventId, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Événement mis à jour", response));
    }

    @PostMapping("/{eventId}/publish")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Publier un événement", description = "Publier un événement")
    public ResponseEntity<ApiResponse<EventResponse>> publishEvent(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String userId = userDetailsService.getCurrentUserId();
        EventResponse response = eventService.publishEvent(eventId, userId);
        return ResponseEntity.ok(ApiResponse.success("Événement publié", response));
    }

    @PostMapping("/{eventId}/cancel")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Annuler un événement", description = "Annuler un événement")
    public ResponseEntity<ApiResponse<EventResponse>> cancelEvent(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String userId = userDetailsService.getCurrentUserId();
        EventResponse response = eventService.cancelEvent(eventId, userId);
        return ResponseEntity.ok(ApiResponse.success("Événement annulé", response));
    }

    @DeleteMapping("/{eventId}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Supprimer un événement", description = "Supprimer un événement")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String userId = userDetailsService.getCurrentUserId();
        eventService.deleteEvent(eventId, userId);
        return ResponseEntity.ok(ApiResponse.success("Événement supprimé", null));
    }

    @GetMapping("/my-events")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Mes événements", description = "Récupérer les événements de l'utilisateur connecté")
    public ResponseEntity<ApiResponse<PageResponse<EventResponse>>> getMyEvents(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        String userId = userDetailsService.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateDebut").descending());
        PageResponse<EventResponse> response = eventService.getEventsByOrganisateur(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}