package com.eventhub.service;

import com.eventhub.dto.request.CreateEventRequest;
import com.eventhub.dto.request.UpdateEventRequest;
import com.eventhub.dto.response.EventResponse;
import com.eventhub.dto.response.EventWithTicketsResponse;
import com.eventhub.dto.response.PageResponse;
import com.eventhub.dto.response.TicketResponse;
import com.eventhub.entity.Event;
import com.eventhub.entity.User;
import com.eventhub.exception.*;
import com.eventhub.mapper.EventMapper;
import com.eventhub.mapper.TicketMapper;
import com.eventhub.repository.EventRepository;
import com.eventhub.repository.ReviewRepository;
import com.eventhub.repository.TicketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventService {

    private static final Logger log = LoggerFactory.getLogger(EventService.class);

    private final EventRepository eventRepository;
    private final TicketRepository ticketRepository;
    private final ReviewRepository reviewRepository;
    private final EventMapper eventMapper;
    private final TicketMapper ticketMapper;
    private final UserService userService;

    public EventService(EventRepository eventRepository, TicketRepository ticketRepository, ReviewRepository reviewRepository,
                       EventMapper eventMapper, TicketMapper ticketMapper, UserService userService) {
        this.eventRepository = eventRepository;
        this.ticketRepository = ticketRepository;
        this.reviewRepository = reviewRepository;
        this.eventMapper = eventMapper;
        this.ticketMapper = ticketMapper;
        this.userService = userService;
    }

    @Transactional
    public EventResponse createEvent(CreateEventRequest request, String organisateurId) {
        log.info("Creating event for organisateur: {}", organisateurId);

        User organisateur = userService.getUserEntity(organisateurId);
        Event event = eventMapper.toEntity(request, organisateur);
        event = eventRepository.save(event);

        log.info("Event created: {}", event.getEventId());
        return eventMapper.toResponse(event);
    }

    @Transactional(readOnly = true)
    public EventResponse getEventById(String eventId) {
        Event event = findEventById(eventId);
        return enrichEventWithStats(eventMapper.toResponse(event));
    }

    @Transactional(readOnly = true)
    public EventWithTicketsResponse getEventWithTickets(String eventId) {
        Event event = findEventById(eventId);
        List<TicketResponse> tickets = ticketMapper.toResponses(ticketRepository.findAvailableByEvent(eventId));

        EventWithTicketsResponse response = new EventWithTicketsResponse();
        response.setEvent(enrichEventWithStats(eventMapper.toResponse(event)));
        response.setTickets(tickets);
        return response;
    }

    @Transactional
    public EventResponse updateEvent(String eventId, UpdateEventRequest request, String userId) {
        log.info("Updating event: {} by user: {}", eventId, userId);

        Event event = findEventById(eventId);
        validateOrganisateur(event, userId);

        eventMapper.updateEntity(event, request);
        event = eventRepository.save(event);

        return eventMapper.toResponse(event);
    }

    @Transactional
    public EventResponse publishEvent(String eventId, String userId) {
        log.info("Publishing event: {} by user: {}", eventId, userId);

        Event event = findEventById(eventId);
        validateOrganisateur(event, userId);

        event.setEstPublie(true);
        event.setStatut("published");
        event = eventRepository.save(event);

        log.info("Event published: {}", eventId);
        return eventMapper.toResponse(event);
    }

    @Transactional
    public EventResponse cancelEvent(String eventId, String userId) {
        log.info("Cancelling event: {} by user: {}", eventId, userId);

        Event event = findEventById(eventId);
        validateOrganisateur(event, userId);

        event.setStatut("cancelled");
        event = eventRepository.save(event);

        log.info("Event cancelled: {}", eventId);
        return eventMapper.toResponse(event);
    }

    @Transactional
    public void deleteEvent(String eventId, String userId) {
        log.info("Deleting event: {} by user: {}", eventId, userId);

        Event event = findEventById(eventId);
        validateOrganisateur(event, userId);

        eventRepository.delete(event);
        log.info("Event deleted: {}", eventId);
    }

    @Transactional(readOnly = true)
    public PageResponse<EventResponse> getEventsByOrganisateur(String organisateurId, Pageable pageable) {
        Page<Event> page = eventRepository.findByOrganisateurUid(organisateurId, pageable);
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<EventResponse> getPublishedEvents(Pageable pageable) {
        Page<Event> page = eventRepository.findByEstPublieTrue(pageable);
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<EventResponse> getUpcomingEvents(Pageable pageable) {
        Page<Event> page = eventRepository.findUpcomingEvents(LocalDateTime.now(), pageable);
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<EventResponse> getPastEvents(Pageable pageable) {
        Page<Event> page = eventRepository.findPastEvents(LocalDateTime.now(), pageable);
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<EventResponse> getEventsByCategory(String category, Pageable pageable) {
        Page<Event> page = eventRepository.findByCategorie(category, pageable);
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<EventResponse> searchEvents(String keyword, Pageable pageable) {
        Page<Event> page = eventRepository.searchEvents(keyword, pageable);
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public List<String> getAllCategories() {
        return eventRepository.findAllCategories();
    }

    public Event findEventById(String eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement non trouvé"));
    }

    public Event getEventEntity(String eventId) {
        return findEventById(eventId);
    }

    private void validateOrganisateur(Event event, String userId) {
        if (!event.getOrganisateur().getUid().equals(userId)) {
            throw new UnauthorizedException("Vous n'êtes pas l'organisateur de cet événement");
        }
    }

    private EventResponse enrichEventWithStats(EventResponse response) {
        Double avgRating = reviewRepository.calculateAverageRatingByEvent(response.getEventId());
        Long count = reviewRepository.countByEvent(response.getEventId());

        response.setAverageRating(avgRating);
        response.setReviewCount(count != null ? count.intValue() : 0);

        return response;
    }

    private PageResponse<EventResponse> toPageResponse(Page<Event> page) {
        PageResponse<EventResponse> response = new PageResponse<>();
        response.setContent(eventMapper.toResponses(page.getContent()));
        response.setPage(page.getNumber());
        response.setSize(page.getSize());
        response.setTotalElements(page.getTotalElements());
        response.setTotalPages(page.getTotalPages());
        response.setFirst(page.isFirst());
        response.setLast(page.isLast());
        return response;
    }
}