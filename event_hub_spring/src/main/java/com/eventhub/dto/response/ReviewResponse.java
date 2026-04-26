package com.eventhub.dto.response;

import java.time.LocalDateTime;

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

    public ReviewResponse() {}

    public String getReviewId() { return reviewId; }
    public void setReviewId(String reviewId) { this.reviewId = reviewId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public Integer getNote() { return note; }
    public void setNote(Integer note) { this.note = note; }
    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }
    public Boolean getVerifie() { return verifie; }
    public void setVerifie(Boolean verifie) { this.verifie = verifie; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getUserNom() { return userNom; }
    public void setUserNom(String userNom) { this.userNom = userNom; }
    public String getUserPhotoURL() { return userPhotoURL; }
    public void setUserPhotoURL(String userPhotoURL) { this.userPhotoURL = userPhotoURL; }
}