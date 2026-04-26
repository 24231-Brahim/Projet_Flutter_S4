package com.eventhub.service;

import com.eventhub.dto.request.CreateTicketRequest;
import com.eventhub.dto.request.UpdateTicketRequest;
import com.eventhub.dto.response.PageResponse;
import com.eventhub.dto.response.TicketResponse;
import com.eventhub.entity.Event;
import com.eventhub.entity.Ticket;
import com.eventhub.exception.*;
import com.eventhub.mapper.TicketMapper;
import com.eventhub.repository.TicketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TicketService {

    private static final Logger log = LoggerFactory.getLogger(TicketService.class);

    private final TicketRepository ticketRepository;
    private final EventService eventService;
    private final TicketMapper ticketMapper;

    public TicketService(TicketRepository ticketRepository, EventService eventService, TicketMapper ticketMapper) {
        this.ticketRepository = ticketRepository;
        this.eventService = eventService;
        this.ticketMapper = ticketMapper;
    }

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, String userId) {
        log.info("Creating ticket for event: {} by user: {}", request.getEventId(), userId);

        Event event = eventService.getEventEntity(request.getEventId());

        if (!event.getOrganisateur().getUid().equals(userId)) {
            throw new UnauthorizedException("Vous n'êtes pas l'organisateur de cet événement");
        }

        Ticket ticket = ticketMapper.toEntity(request, event);
        ticket = ticketRepository.save(ticket);

        log.info("Ticket created: {}", ticket.getTicketId());
        return ticketMapper.toResponse(ticket);
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketById(String ticketId) {
        Ticket ticket = findTicketById(ticketId);
        return ticketMapper.toResponse(ticket);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getTicketsByEvent(String eventId) {
        List<Ticket> tickets = ticketRepository.findAvailableByEvent(eventId);
        return ticketMapper.toResponses(tickets);
    }

    @Transactional(readOnly = true)
    public PageResponse<TicketResponse> getTicketsByEventPaged(String eventId, Pageable pageable) {
        Page<Ticket> page = ticketRepository.findByEventEventId(eventId, pageable);
        return toPageResponse(page);
    }

    @Transactional
    public TicketResponse updateTicket(String ticketId, UpdateTicketRequest request, String userId) {
        log.info("Updating ticket: {} by user: {}", ticketId, userId);

        Ticket ticket = findTicketById(ticketId);
        validateOrganisateur(ticket, userId);

        ticketMapper.updateEntity(ticket, request);
        ticket = ticketRepository.save(ticket);

        return ticketMapper.toResponse(ticket);
    }

    @Transactional
    public void deleteTicket(String ticketId, String userId) {
        log.info("Deleting ticket: {} by user: {}", ticketId, userId);

        Ticket ticket = findTicketById(ticketId);
        validateOrganisateur(ticket, userId);

        ticketRepository.delete(ticket);
        log.info("Ticket deleted: {}", ticketId);
    }

    @Transactional
    public boolean decreaseStock(String ticketId, int quantity) {
        int updated = ticketRepository.decreaseStock(ticketId, quantity);
        return updated > 0;
    }

    @Transactional
    public void increaseStock(String ticketId, int quantity) {
        ticketRepository.increaseStock(ticketId, quantity);
    }

    public Ticket findTicketById(String ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket non trouvé"));
    }

    public Ticket getTicketEntity(String ticketId) {
        return findTicketById(ticketId);
    }

    private void validateOrganisateur(Ticket ticket, String userId) {
        if (!ticket.getEvent().getOrganisateur().getUid().equals(userId)) {
            throw new UnauthorizedException("Vous n'êtes pas l'organisateur de cet événement");
        }
    }

    private PageResponse<TicketResponse> toPageResponse(Page<Ticket> page) {
        PageResponse<TicketResponse> response = new PageResponse<>();
        response.setContent(ticketMapper.toResponses(page.getContent()));
        response.setPage(page.getNumber());
        response.setSize(page.getSize());
        response.setTotalElements(page.getTotalElements());
        response.setTotalPages(page.getTotalPages());
        response.setFirst(page.isFirst());
        response.setLast(page.isLast());
        return response;
    }
}