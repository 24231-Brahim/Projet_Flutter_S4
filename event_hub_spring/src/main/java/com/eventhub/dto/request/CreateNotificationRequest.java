package com.eventhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

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

    public CreateNotificationRequest() {}

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }
    public String getCorps() { return corps; }
    public void setCorps(String corps) { this.corps = corps; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Map<String, String> getData() { return data; }
    public void setData(Map<String, String> data) { this.data = data; }
}