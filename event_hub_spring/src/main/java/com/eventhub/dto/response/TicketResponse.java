package com.eventhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
}