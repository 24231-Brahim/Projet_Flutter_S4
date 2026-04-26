package com.eventhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private String bookingId;
    private String userId;
    private String eventId;
    private String ticketId;
    private EventResponse event;
    private TicketResponse ticket;
    private Integer quantite;
    private Double montantTotal;
    private String devise;
    private String statut;
    private String qrCodeToken;
    private String qrCodeURL;
    private String pdfURL;
    private String paymentId;
    private LocalDateTime scannedAt;
    private LocalDateTime dateReservation;
    private LocalDateTime updatedAt;
    private Boolean isPending;
    private Boolean isConfirmed;
    private Boolean isCancelled;
    private Boolean isRefunded;
    private Boolean isUsed;
    private Boolean isScanned;
}