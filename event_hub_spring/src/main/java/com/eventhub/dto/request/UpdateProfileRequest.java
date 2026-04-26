package com.eventhub.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
    private String nom;

    private String telephone;

    private String photoURL;

    private String fcmToken;

    private List<String> favoris;
}