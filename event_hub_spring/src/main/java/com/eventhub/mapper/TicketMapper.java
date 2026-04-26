package com.eventhub.mapper;

import com.eventhub.dto.request.CreateTicketRequest;
import com.eventhub.dto.request.UpdateTicketRequest;
import com.eventhub.dto.response.TicketResponse;
import com.eventhub.entity.Event;
import com.eventhub.entity.Ticket;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TicketMapper {

    public Ticket toEntity(CreateTicketRequest request, Event event) {
        return Ticket.builder()
                .event(event)
                .type(request.getType())
                .prix(request.getPrix())
                .quantiteDisponible(request.getQuantiteDisponible())
                .quantiteVendue(0)
                .description(request.getDescription() != null ? request.getDescription() : "")
                .actif(true)
                .build();
    }

    public void updateEntity(Ticket ticket, UpdateTicketRequest request) {
        if (request.getType() != null) {
            ticket.setType(request.getType());
        }
        if (request.getPrix() != null) {
            ticket.setPrix(request.getPrix());
        }
        if (request.getQuantiteDisponible() != null) {
            ticket.setQuantiteDisponible(request.getQuantiteDisponible());
        }
        if (request.getDescription() != null) {
            ticket.setDescription(request.getDescription());
        }
        if (request.getActif() != null) {
            ticket.setActif(request.getActif());
        }
    }

    public TicketResponse toResponse(Ticket ticket) {
        if (ticket == null) return null;

        return TicketResponse.builder()
                .ticketId(ticket.getTicketId())
                .eventId(ticket.getEvent() != null ? ticket.getEvent().getEventId() : null)
                .type(ticket.getType())
                .typeDisplay(ticket.getTypeDisplay())
                .prix(ticket.getPrix())
                .quantiteDisponible(ticket.getQuantiteDisponible())
                .quantiteVendue(ticket.getQuantiteVendue())
                .description(ticket.getDescription())
                .actif(ticket.getActif())
                .isAvailable(ticket.isAvailable())
                .isSoldOut(ticket.isSoldOut())
                .isStandard(ticket.isStandard())
                .isVip(ticket.isVip())
                .isEarlyBird(ticket.isEarlyBird())
                .build();
    }

    public List<TicketResponse> toResponses(List<Ticket> tickets) {
        return tickets.stream()
                .map(this::toResponse)
                .toList();
    }
}