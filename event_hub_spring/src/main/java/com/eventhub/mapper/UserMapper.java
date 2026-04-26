package com.eventhub.mapper;

import com.eventhub.dto.request.RegisterRequest;
import com.eventhub.dto.request.UpdateProfileRequest;
import com.eventhub.dto.response.UserResponse;
import com.eventhub.entity.User;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class UserMapper {

    public User toEntity(RegisterRequest request, String passwordHash) {
        User user = new User();
        user.setNom(request.getNom());
        user.setEmail(request.getEmail().toLowerCase());
        user.setPasswordHash(passwordHash);
        user.setTelephone(request.getTelephone() != null ? request.getTelephone() : "");
        user.setPhotoURL(request.getPhotoURL() != null ? request.getPhotoURL() : "");
        user.setRole("user");
        user.setVerifie(false);
        return user;
    }

    public void updateEntity(User user, UpdateProfileRequest request) {
        if (request.getNom() != null) user.setNom(request.getNom());
        if (request.getTelephone() != null) user.setTelephone(request.getTelephone());
        if (request.getPhotoURL() != null) user.setPhotoURL(request.getPhotoURL());
        if (request.getFcmToken() != null) user.setFcmToken(request.getFcmToken());
        if (request.getFavoris() != null) user.setFavoris(request.getFavoris());
    }

    public UserResponse toResponse(User user) {
        if (user == null) return null;
        UserResponse response = new UserResponse();
        response.setUid(user.getUid());
        response.setNom(user.getNom());
        response.setEmail(user.getEmail());
        response.setTelephone(user.getTelephone());
        response.setPhotoURL(user.getPhotoURL());
        response.setRole(user.getRole());
        response.setFavoris(user.getFavoris());
        response.setVerifie(user.getVerifie());
        response.setIsOrganisateur(user.isOrganisateur());
        response.setIsAdmin(user.isAdmin());
        response.setIsVerified(user.isVerified());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        return response;
    }

    public List<UserResponse> toResponses(List<User> users) {
        return users.stream().map(this::toResponse).toList();
    }
}