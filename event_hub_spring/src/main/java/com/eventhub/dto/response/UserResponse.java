package com.eventhub.dto.response;

import java.util.List;

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
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;

    public UserResponse() {}

    public String getUid() { return uid; }
    public void setUid(String uid) { this.uid = uid; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }
    public String getPhotoURL() { return photoURL; }
    public void setPhotoURL(String photoURL) { this.photoURL = photoURL; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public List<String> getFavoris() { return favoris; }
    public void setFavoris(List<String> favoris) { this.favoris = favoris; }
    public Boolean getVerifie() { return verifie; }
    public void setVerifie(Boolean verifie) { this.verifie = verifie; }
    public Boolean getIsOrganisateur() { return isOrganisateur; }
    public void setIsOrganisateur(Boolean isOrganisateur) { this.isOrganisateur = isOrganisateur; }
    public Boolean getIsAdmin() { return isAdmin; }
    public void setIsAdmin(Boolean isAdmin) { this.isAdmin = isAdmin; }
    public Boolean getIsVerified() { return isVerified; }
    public void setIsVerified(Boolean isVerified) { this.isVerified = isVerified; }
    public java.time.LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }
    public java.time.LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(java.time.LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}