package com.eventhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequest {

    @NotBlank(message = "L'ID de l'utilisateur est requis")
    private String userId;

    @NotBlank(message = "Le titre est requis")
    private String titre;

    @NotBlank(message = "Le corps est requis")
    private String corps;

    @NotBlank(message = "Le type est requis")
    private String type;

    private Map<String, String> data;
}