package com.eventhub.dto.response;

public class TicketResponse {
    private String ticketId;
    private String eventId;
    private String type;
    private String typeDisplay;
    private Double prix;
    private Integer quantiteDisponible;
    private Integer quantiteVendue;
    private String description;
    private Boolean actif;
    private Boolean isAvailable;
    private Boolean isSoldOut;
    private Boolean isStandard;
    private Boolean isVip;
    private Boolean isEarlyBird;

    public TicketResponse() {}

    public String getTicketId() { return ticketId; }
    public void setTicketId(String ticketId) { this.ticketId = ticketId; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTypeDisplay() { return typeDisplay; }
    public void setTypeDisplay(String typeDisplay) { this.typeDisplay = typeDisplay; }
    public Double getPrix() { return prix; }
    public void setPrix(Double prix) { this.prix = prix; }
    public Integer getQuantiteDisponible() { return quantiteDisponible; }
    public void setQuantiteDisponible(Integer quantiteDisponible) { this.quantiteDisponible = quantiteDisponible; }
    public Integer getQuantiteVendue() { return quantiteVendue; }
    public void setQuantiteVendue(Integer quantiteVendue) { this.quantiteVendue = quantiteVendue; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getActif() { return actif; }
    public void setActif(Boolean actif) { this.actif = actif; }
    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
    public Boolean getIsSoldOut() { return isSoldOut; }
    public void setIsSoldOut(Boolean isSoldOut) { this.isSoldOut = isSoldOut; }
    public Boolean getIsStandard() { return isStandard; }
    public void setIsStandard(Boolean isStandard) { this.isStandard = isStandard; }
    public Boolean getIsVip() { return isVip; }
    public void setIsVip(Boolean isVip) { this.isVip = isVip; }
    public Boolean getIsEarlyBird() { return isEarlyBird; }
    public void setIsEarlyBird(Boolean isEarlyBird) { this.isEarlyBird = isEarlyBird; }
}