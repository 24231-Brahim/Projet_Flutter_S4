package com.eventhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class CreateTicketRequest {
    @NotBlank(message = "L'ID de l'événement est requis")
    private String eventId;

    @NotBlank(message = "Le type est requis")
    private String type;

    @NotNull(message = "Le prix est requis")
    @Positive(message = "Le prix doit être positif")
    private Double prix;

    @NotNull(message = "La quantité disponible est requise")
    @Positive(message = "La quantité doit être positive")
    private Integer quantiteDisponible;

    private String description;

    public CreateTicketRequest() {}

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Double getPrix() { return prix; }
    public void setPrix(Double prix) { this.prix = prix; }
    public Integer getQuantiteDisponible() { return quantiteDisponible; }
    public void setQuantiteDisponible(Integer quantiteDisponible) { this.quantiteDisponible = quantiteDisponible; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}