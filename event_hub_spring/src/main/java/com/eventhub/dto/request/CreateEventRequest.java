package com.eventhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEventRequest {

    @NotBlank(message = "Le titre est requis")
    private String titre;

    @NotBlank(message = "La description est requise")
    private String description;

    @NotBlank(message = "La catégorie est requise")
    private String categorie;

    private String imageURL;

    @NotBlank(message = "Le lieu est requis")
    private String lieu;

    private Double latitude;
    private Double longitude;

    @NotNull(message = "La date de début est requise")
    private LocalDateTime dateDebut;

    @NotNull(message = "La date de fin est requise")
    private LocalDateTime dateFin;

    @NotNull(message = "La capacité totale est requise")
    @Positive(message = "La capacité doit être positive")
    private Integer capaciteTotale;

    private List<String> tags;
}