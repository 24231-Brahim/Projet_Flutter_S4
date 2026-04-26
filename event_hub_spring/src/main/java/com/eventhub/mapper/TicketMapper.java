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
        Ticket ticket = new Ticket();
        ticket.setEvent(event);
        ticket.setType(request.getType());
        ticket.setPrix(request.getPrix());
        ticket.setQuantiteDisponible(request.getQuantiteDisponible());
        ticket.setQuantiteVendue(0);
        ticket.setDescription(request.getDescription() != null ? request.getDescription() : "");
        ticket.setActif(true);
        return ticket;
    }

    public void updateEntity(Ticket ticket, UpdateTicketRequest request) {
        if (request.getType() != null) ticket.setType(request.getType());
        if (request.getPrix() != null) ticket.setPrix(request.getPrix());
        if (request.getQuantiteDisponible() != null) ticket.setQuantiteDisponible(request.getQuantiteDisponible());
        if (request.getDescription() != null) ticket.setDescription(request.getDescription());
        if (request.getActif() != null) ticket.setActif(request.getActif());
    }

    public TicketResponse toResponse(Ticket ticket) {
        if (ticket == null) return null;
        TicketResponse response = new TicketResponse();
        response.setTicketId(ticket.getTicketId());
        response.setEventId(ticket.getEvent() != null ? ticket.getEvent().getEventId() : null);
        response.setType(ticket.getType());
        response.setTypeDisplay(ticket.getTypeDisplay());
        response.setPrix(ticket.getPrix());
        response.setQuantiteDisponible(ticket.getQuantiteDisponible());
        response.setQuantiteVendue(ticket.getQuantiteVendue());
        response.setDescription(ticket.getDescription());
        response.setActif(ticket.getActif());
        response.setIsAvailable(ticket.isAvailable());
        response.setIsSoldOut(ticket.isSoldOut());
        response.setIsStandard(ticket.isStandard());
        response.setIsVip(ticket.isVip());
        response.setIsEarlyBird(ticket.isEarlyBird());
        return response;
    }

    public List<TicketResponse> toResponses(List<Ticket> tickets) {
        return tickets.stream().map(this::toResponse).toList();
    }
}