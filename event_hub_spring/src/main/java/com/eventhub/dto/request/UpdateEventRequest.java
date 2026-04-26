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
}