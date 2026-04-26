package com.eventhub.mapper;

import com.eventhub.dto.response.BookingResponse;
import com.eventhub.dto.response.BookingWithClientSecretResponse;
import com.eventhub.entity.Booking;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class BookingMapper {

    private final EventMapper eventMapper;
    private final TicketMapper ticketMapper;

    public BookingMapper(EventMapper eventMapper, TicketMapper ticketMapper) {
        this.eventMapper = eventMapper;
        this.ticketMapper = ticketMapper;
    }

    public BookingResponse toResponse(Booking booking) {
        if (booking == null) return null;
        BookingResponse response = new BookingResponse();
        response.setBookingId(booking.getBookingId());
        response.setUserId(booking.getUser() != null ? booking.getUser().getUid() : null);
        response.setEventId(booking.getEvent() != null ? booking.getEvent().getEventId() : null);
        response.setTicketId(booking.getTicket() != null ? booking.getTicket().getTicketId() : null);
        response.setEvent(booking.getEvent() != null ? eventMapper.toResponse(booking.getEvent()) : null);
        response.setTicket(booking.getTicket() != null ? ticketMapper.toResponse(booking.getTicket()) : null);
        response.setQuantite(booking.getQuantite());
        response.setMontantTotal(booking.getMontantTotal());
        response.setDevise(booking.getDevise());
        response.setStatut(booking.getStatut());
        response.setQrCodeToken(booking.getQrCodeToken());
        response.setQrCodeURL(booking.getQrCodeURL());
        response.setPdfURL(booking.getPdfURL());
        response.setPaymentId(booking.getPaymentId());
        response.setScannedAt(booking.getScannedAt());
        response.setDateReservation(booking.getDateReservation());
        response.setUpdatedAt(booking.getUpdatedAt());
        response.setIsPending(booking.isPending());
        response.setIsConfirmed(booking.isConfirmed());
        response.setIsCancelled(booking.isCancelled());
        response.setIsRefunded(booking.isRefunded());
        response.setIsUsed(booking.isUsed());
        response.setIsScanned(booking.isScanned());
        return response;
    }

    public BookingWithClientSecretResponse toClientSecretResponse(Booking booking, String clientSecret) {
        if (booking == null) return null;
        BookingWithClientSecretResponse response = new BookingWithClientSecretResponse();
        response.setBookingId(booking.getBookingId());
        response.setClientSecret(clientSecret);
        response.setPaymentId(booking.getPaymentId());
        response.setMontantTotal(booking.getMontantTotal());
        response.setStatut(booking.getStatut());
        return response;
    }

    public List<BookingResponse> toResponses(List<Booking> bookings) {
        return bookings.stream().map(this::toResponse).toList();
    }
}