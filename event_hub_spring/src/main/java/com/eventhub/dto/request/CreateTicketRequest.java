package com.eventhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
}