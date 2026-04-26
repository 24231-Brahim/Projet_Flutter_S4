package com.eventhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    private String reviewId;
    private String userId;
    private String eventId;
    private Integer note;
    private String commentaire;
    private Boolean verifie;
    private LocalDateTime createdAt;
    private String userNom;
    private String userPhotoURL;
}