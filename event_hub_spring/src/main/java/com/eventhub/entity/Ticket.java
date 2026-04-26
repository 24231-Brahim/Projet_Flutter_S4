package com.eventhub.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tickets")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ticket_id", updatable = false, nullable = false)
    private String ticketId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    @Column(nullable = false)
    private String type = "standard";

    @Column(nullable = false)
    private Double prix;

    @Column(name = "quantite_disponible", nullable = false)
    private Integer quantiteDisponible;

    @Column(name = "quantite_vendue", nullable = false)
    private Integer quantiteVendue = 0;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Boolean actif = true;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Booking> bookings = new ArrayList<>();

    public Ticket() {}

    public String getTicketId() { return ticketId; }
    public void setTicketId(String ticketId) { this.ticketId = ticketId; }
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
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
    public List<Booking> getBookings() { return bookings; }
    public void setBookings(List<Booking> bookings) { this.bookings = bookings; }

    public boolean isAvailable() { return actif != null && actif && quantiteDisponible != null && quantiteDisponible > 0; }
    public boolean isSoldOut() { return quantiteDisponible != null && quantiteDisponible <= 0; }
    public boolean isStandard() { return "standard".equals(type); }
    public boolean isVip() { return "vip".equals(type); }
    public boolean isEarlyBird() { return "early_bird".equals(type); }
    public String getTypeDisplay() {
        return switch (type) {
            case "vip" -> "VIP";
            case "early_bird" -> "Early Bird";
            default -> "Standard";
        };
    }
}