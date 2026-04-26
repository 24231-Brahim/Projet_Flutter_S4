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

        return BookingResponse.builder()
                .bookingId(booking.getBookingId())
                .userId(booking.getUser() != null ? booking.getUser().getUid() : null)
                .eventId(booking.getEvent() != null ? booking.getEvent().getEventId() : null)
                .ticketId(booking.getTicket() != null ? booking.getTicket().getTicketId() : null)
                .event(booking.getEvent() != null ? eventMapper.toResponse(booking.getEvent()) : null)
                .ticket(booking.getTicket() != null ? ticketMapper.toResponse(booking.getTicket()) : null)
                .quantite(booking.getQuantite())
                .montantTotal(booking.getMontantTotal())
                .devise(booking.getDevise())
                .statut(booking.getStatut())
                .qrCodeToken(booking.getQrCodeToken())
                .qrCodeURL(booking.getQrCodeURL())
                .pdfURL(booking.getPdfURL())
                .paymentId(booking.getPaymentId())
                .scannedAt(booking.getScannedAt())
                .dateReservation(booking.getDateReservation())
                .updatedAt(booking.getUpdatedAt())
                .isPending(booking.isPending())
                .isConfirmed(booking.isConfirmed())
                .isCancelled(booking.isCancelled())
                .isRefunded(booking.isRefunded())
                .isUsed(booking.isUsed())
                .isScanned(booking.isScanned())
                .build();
    }

    public BookingWithClientSecretResponse toClientSecretResponse(Booking booking, String clientSecret) {
        if (booking == null) return null;

        return BookingWithClientSecretResponse.builder()
                .bookingId(booking.getBookingId())
                .clientSecret(clientSecret)
                .paymentId(booking.getPaymentId())
                .montantTotal(booking.getMontantTotal())
                .statut(booking.getStatut())
                .build();
    }

    public List<BookingResponse> toResponses(List<Booking> bookings) {
        return bookings.stream()
                .map(this::toResponse)
                .toList();
    }
}