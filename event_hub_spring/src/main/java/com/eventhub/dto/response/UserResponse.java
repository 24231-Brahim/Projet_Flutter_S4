package com.eventhub.dto.response;

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
public class UserResponse {

    private String uid;
    private String nom;
    private String email;
    private String telephone;
    private String photoURL;
    private String role;
    private List<String> favoris;
    private Boolean verifie;
    private Boolean isOrganisateur;
    private Boolean isAdmin;
    private Boolean isVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}