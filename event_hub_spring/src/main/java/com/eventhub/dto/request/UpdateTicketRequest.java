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
public class UpdateTicketRequest {

    private String type;

    @Positive(message = "Le prix doit être positif")
    private Double prix;

    @Positive(message = "La quantité doit être positive")
    private Integer quantiteDisponible;

    private String description;

    private Boolean actif;
}