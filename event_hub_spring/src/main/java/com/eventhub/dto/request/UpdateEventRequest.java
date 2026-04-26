package com.eventhub.dto.request;

import java.time.LocalDateTime;
import java.util.List;

public class UpdateEventRequest {
    private String titre;
    private String description;
    private String categorie;
    private String imageURL;
    private String lieu;
    private Double latitude;
    private Double longitude;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private Integer capaciteTotale;
    private List<String> tags;
    private Boolean estPublie;
    private String statut;

    public UpdateEventRequest() {}

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategorie() { return categorie; }
    public void setCategorie(String categorie) { this.categorie = categorie; }
    public String getImageURL() { return imageURL; }
    public void setImageURL(String imageURL) { this.imageURL = imageURL; }
    public String getLieu() { return lieu; }
    public void setLieu(String lieu) { this.lieu = lieu; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public LocalDateTime getDateDebut() { return dateDebut; }
    public void setDateDebut(LocalDateTime dateDebut) { this.dateDebut = dateDebut; }
    public LocalDateTime getDateFin() { return dateFin; }
    public void setDateFin(LocalDateTime dateFin) { this.dateFin = dateFin; }
    public Integer getCapaciteTotale() { return capaciteTotale; }
    public void setCapaciteTotale(Integer capaciteTotale) { this.capaciteTotale = capaciteTotale; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public Boolean getEstPublie() { return estPublie; }
    public void setEstPublie(Boolean estPublie) { this.estPublie = estPublie; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
}