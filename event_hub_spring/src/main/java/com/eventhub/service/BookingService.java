package com.eventhub.service;

import com.eventhub.dto.request.CreateBookingRequest;
import com.eventhub.dto.response.BookingResponse;
import com.eventhub.dto.response.BookingWithClientSecretResponse;
import com.eventhub.dto.response.PageResponse;
import com.eventhub.entity.Booking;
import com.eventhub.entity.Event;
import com.eventhub.entity.Ticket;
import com.eventhub.entity.User;
import com.eventhub.exception.*;
import com.eventhub.mapper.BookingMapper;
import com.eventhub.repository.BookingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookingRepository;
    private final EventService eventService;
    private final TicketService ticketService;
    private final UserService userService;
    private final BookingMapper bookingMapper;

    public BookingService(BookingRepository bookingRepository, EventService eventService,
                          TicketService ticketService, UserService userService, BookingMapper bookingMapper) {
        this.bookingRepository = bookingRepository;
        this.eventService = eventService;
        this.ticketService = ticketService;
        this.userService = userService;
        this.bookingMapper = bookingMapper;
    }

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request, String userId) {
        log.info("Creating booking for user: {}, event: {}, ticket: {}", userId, request.getEventId(), request.getTicketId());

        User user = userService.getUserEntity(userId);
        Event event = eventService.getEventEntity(request.getEventId());
        Ticket ticket = ticketService.getTicketEntity(request.getTicketId());

        if (!ticket.getEvent().getEventId().equals(event.getEventId())) {
            throw new InvalidRequestException("Le ticket n'appartient pas à cet événement");
        }

        if (!ticket.isAvailable()) {
            throw new InsufficientStockException("Le ticket n'est plus disponible");
        }

        double montantTotal = ticket.getPrix() * request.getQuantite();

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setEvent(event);
        booking.setTicket(ticket);
        booking.setQuantite(request.getQuantite());
        booking.setMontantTotal(montantTotal);
        booking.setDevise(request.getDevise() != null ? request.getDevise() : "USD");
        booking.setStatut("pending");
        booking.setQrCodeToken(UUID.randomUUID().toString());

        booking = bookingRepository.save(booking);

        log.info("Booking created: {}", booking.getBookingId());
        return bookingMapper.toResponse(booking);
    }

    @Transactional
    public BookingWithClientSecretResponse initiatePayment(String bookingId) {
        log.info("Initiating payment for booking: {}", bookingId);

        Booking booking = findBookingById(bookingId);

        if (booking.isCancelled()) {
            throw new InvalidRequestException("Cette réservation a été annulée");
        }

        String clientSecret = "pi_" + UUID.randomUUID() + "_secret_" + UUID.randomUUID();
        booking.setPaymentId(clientSecret.split("_secret")[0]);
        booking = bookingRepository.save(booking);

        return bookingMapper.toClientSecretResponse(booking, clientSecret);
    }

    @Transactional
    public BookingResponse confirmBooking(String bookingId) {
        log.info("Confirming booking: {}", bookingId);

        Booking booking = findBookingById(bookingId);

        if (!ticketService.decreaseStock(booking.getTicket().getTicketId(), booking.getQuantite())) {
            throw new InsufficientStockException("Stock insuffisant pour confirmer la réservation");
        }

        booking.setStatut("confirmed");
        booking = bookingRepository.save(booking);

        log.info("Booking confirmed: {}", bookingId);
        return bookingMapper.toResponse(booking);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(String bookingId) {
        Booking booking = findBookingById(bookingId);
        return bookingMapper.toResponse(booking);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingByQrToken(String qrToken) {
        Booking booking = bookingRepository.findByQrCodeToken(qrToken)
                .orElseThrow(() -> new ResourceNotFoundException("Réservation non trouvée"));
        return bookingMapper.toResponse(booking);
    }

    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> getBookingsByUser(String userId, Pageable pageable) {
        Page<Booking> page = bookingRepository.findByUserUidWithDetails(userId, pageable);
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> getBookingsByEvent(String eventId, Pageable pageable) {
        Page<Booking> page = bookingRepository.findByEventEventId(eventId, pageable);
        return toPageResponse(page);
    }

    @Transactional
    public BookingResponse cancelBooking(String bookingId, String userId) {
        log.info("Cancelling booking: {} by user: {}", bookingId, userId);

        Booking booking = findBookingById(bookingId);

        if (!booking.getUser().getUid().equals(userId)) {
            throw new UnauthorizedException("Vous n'êtes pas le propriétaire de cette réservation");
        }

        if (booking.isCancelled()) {
            throw new InvalidRequestException("Cette réservation est déjà annulée");
        }

        booking.setStatut("cancelled");

        if (booking.isConfirmed()) {
            ticketService.increaseStock(booking.getTicket().getTicketId(), booking.getQuantite());
        }

        booking = bookingRepository.save(booking);
        log.info("Booking cancelled: {}", bookingId);

        return bookingMapper.toResponse(booking);
    }

    @Transactional
    public BookingResponse scanBooking(String bookingId, String scannerUserId) {
        log.info("Scanning booking: {} by user: {}", bookingId, scannerUserId);

        Booking booking = findBookingById(bookingId);

        if (!booking.isConfirmed()) {
            throw new InvalidRequestException("Cette réservation n'est pas confirmée");
        }

        if (booking.isScanned()) {
            throw new InvalidRequestException("Cette réservation a déjà été scannée");
        }

        booking.setScannedAt(LocalDateTime.now());
        booking.setStatut("used");
        booking = bookingRepository.save(booking);

        log.info("Booking scanned: {}", bookingId);
        return bookingMapper.toResponse(booking);
    }

    public Booking findBookingById(String bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Réservation non trouvée"));
    }

    private PageResponse<BookingResponse> toPageResponse(Page<Booking> page) {
        PageResponse<BookingResponse> response = new PageResponse<>();
        response.setContent(bookingMapper.toResponses(page.getContent()));
        response.setPage(page.getNumber());
        response.setSize(page.getSize());
        response.setTotalElements(page.getTotalElements());
        response.setTotalPages(page.getTotalPages());
        response.setFirst(page.isFirst());
        response.setLast(page.isLast());
        return response;
    }
}