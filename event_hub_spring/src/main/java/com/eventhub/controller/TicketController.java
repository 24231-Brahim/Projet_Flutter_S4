package com.eventhub.controller;

import com.eventhub.dto.request.CreateTicketRequest;
import com.eventhub.dto.request.UpdateTicketRequest;
import com.eventhub.dto.response.ApiResponse;
import com.eventhub.dto.response.PageResponse;
import com.eventhub.dto.response.TicketResponse;
import com.eventhub.security.service.CustomUserDetailsService;
import com.eventhub.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets")
@Tag(name = "Tickets", description = "Gestion des tickets")
@SecurityRequirement(name = "bearerAuth")
public class TicketController {

    private final TicketService ticketService;
    private final CustomUserDetailsService userDetailsService;

    public TicketController(TicketService ticketService, CustomUserDetailsService userDetailsService) {
        this.ticketService = ticketService;
        this.userDetailsService = userDetailsService;
    }

    @GetMapping("/{ticketId}")
    @Operation(summary = "Détail ticket", description = "Récupérer les détails d'un ticket")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicketById(@PathVariable String ticketId) {
        TicketResponse response = ticketService.getTicketById(ticketId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/event/{eventId}")
    @Operation(summary = "Tickets d'un événement", description = "Récupérer les tickets disponibles d'un événement")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getTicketsByEvent(@PathVariable String eventId) {
        List<TicketResponse> response = ticketService.getTicketsByEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/event/{eventId}/paginated")
    @Operation(summary = "Tickets d'un événement (paginé)", description = "Récupérer les tickets d'un événement avec pagination")
    public ResponseEntity<ApiResponse<PageResponse<TicketResponse>>> getTicketsByEventPaged(
            @PathVariable String eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<TicketResponse> response = ticketService.getTicketsByEventPaged(eventId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Créer un ticket", description = "Créer un nouveau ticket pour un événement")
    public ResponseEntity<ApiResponse<TicketResponse>> createTicket(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateTicketRequest request
    ) {
        String userId = userDetailsService.getCurrentUserId();
        TicketResponse response = ticketService.createTicket(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Ticket créé", response));
    }

    @PutMapping("/{ticketId}")
    @Operation(summary = "Modifier un ticket", description = "Mettre à jour un ticket")
    public ResponseEntity<ApiResponse<TicketResponse>> updateTicket(
            @PathVariable String ticketId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateTicketRequest request
    ) {
        String userId = userDetailsService.getCurrentUserId();
        TicketResponse response = ticketService.updateTicket(ticketId, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Ticket mis à jour", response));
    }

    @DeleteMapping("/{ticketId}")
    @Operation(summary = "Supprimer un ticket", description = "Supprimer un ticket")
    public ResponseEntity<ApiResponse<Void>> deleteTicket(
            @PathVariable String ticketId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String userId = userDetailsService.getCurrentUserId();
        ticketService.deleteTicket(ticketId, userId);
        return ResponseEntity.ok(ApiResponse.success("Ticket supprimé", null));
    }
}