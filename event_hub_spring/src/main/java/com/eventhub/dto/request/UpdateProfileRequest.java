package com.eventhub.dto.request;

import jakarta.validation.constraints.Size;
import java.util.List;

public class UpdateProfileRequest {
    @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
    private String nom;
    private String telephone;
    private String photoURL;
    private String fcmToken;
    private List<String> favoris;

    public UpdateProfileRequest() {}

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }
    public String getPhotoURL() { return photoURL; }
    public void setPhotoURL(String photoURL) { this.photoURL = photoURL; }
    public String getFcmToken() { return fcmToken; }
    public void setFcmToken(String fcmToken) { this.fcmToken = fcmToken; }
    public List<String> getFavoris() { return favoris; }
    public void setFavoris(List<String> favoris) { this.favoris = favoris; }
}