package com.eventhub.dto.request;

import jakarta.validation.constraints.Positive;

public class UpdateTicketRequest {
    private String type;
    @Positive(message = "Le prix doit être positif")
    private Double prix;
    @Positive(message = "La quantité doit être positive")
    private Integer quantiteDisponible;
    private String description;
    private Boolean actif;

    public UpdateTicketRequest() {}

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Double getPrix() { return prix; }
    public void setPrix(Double prix) { this.prix = prix; }
    public Integer getQuantiteDisponible() { return quantiteDisponible; }
    public void setQuantiteDisponible(Integer quantiteDisponible) { this.quantiteDisponible = quantiteDisponible; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getActif() { return actif; }
    public void setActif(Boolean actif) { this.actif = actif; }
}