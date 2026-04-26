package com.eventhub.dto.response;

import java.time.LocalDateTime;

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

    public BookingResponse() {}

    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getTicketId() { return ticketId; }
    public void setTicketId(String ticketId) { this.ticketId = ticketId; }
    public EventResponse getEvent() { return event; }
    public void setEvent(EventResponse event) { this.event = event; }
    public TicketResponse getTicket() { return ticket; }
    public void setTicket(TicketResponse ticket) { this.ticket = ticket; }
    public Integer getQuantite() { return quantite; }
    public void setQuantite(Integer quantite) { this.quantite = quantite; }
    public Double getMontantTotal() { return montantTotal; }
    public void setMontantTotal(Double montantTotal) { this.montantTotal = montantTotal; }
    public String getDevise() { return devise; }
    public void setDevise(String devise) { this.devise = devise; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public String getQrCodeToken() { return qrCodeToken; }
    public void setQrCodeToken(String qrCodeToken) { this.qrCodeToken = qrCodeToken; }
    public String getQrCodeURL() { return qrCodeURL; }
    public void setQrCodeURL(String qrCodeURL) { this.qrCodeURL = qrCodeURL; }
    public String getPdfURL() { return pdfURL; }
    public void setPdfURL(String pdfURL) { this.pdfURL = pdfURL; }
    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
    public LocalDateTime getScannedAt() { return scannedAt; }
    public void setScannedAt(LocalDateTime scannedAt) { this.scannedAt = scannedAt; }
    public LocalDateTime getDateReservation() { return dateReservation; }
    public void setDateReservation(LocalDateTime dateReservation) { this.dateReservation = dateReservation; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Boolean getIsPending() { return isPending; }
    public void setIsPending(Boolean isPending) { this.isPending = isPending; }
    public Boolean getIsConfirmed() { return isConfirmed; }
    public void setIsConfirmed(Boolean isConfirmed) { this.isConfirmed = isConfirmed; }
    public Boolean getIsCancelled() { return isCancelled; }
    public void setIsCancelled(Boolean isCancelled) { this.isCancelled = isCancelled; }
    public Boolean getIsRefunded() { return isRefunded; }
    public void setIsRefunded(Boolean isRefunded) { this.isRefunded = isRefunded; }
    public Boolean getIsUsed() { return isUsed; }
    public void setIsUsed(Boolean isUsed) { this.isUsed = isUsed; }
    public Boolean getIsScanned() { return isScanned; }
    public void setIsScanned(Boolean isScanned) { this.isScanned = isScanned; }
}