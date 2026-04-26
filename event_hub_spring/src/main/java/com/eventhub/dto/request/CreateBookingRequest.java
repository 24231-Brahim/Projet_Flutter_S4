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
public class CreateBookingRequest {

    @NotBlank(message = "L'ID de l'événement est requis")
    private String eventId;

    @NotBlank(message = "L'ID du ticket est requis")
    private String ticketId;

    @NotNull(message = "La quantité est requise")
    @Positive(message = "La quantité doit être positive")
    private Integer quantite;

    private String devise;
}