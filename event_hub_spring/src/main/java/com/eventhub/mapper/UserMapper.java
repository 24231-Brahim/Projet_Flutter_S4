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
        return User.builder()
                .nom(request.getNom())
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordHash)
                .telephone(request.getTelephone() != null ? request.getTelephone() : "")
                .photoURL(request.getPhotoURL() != null ? request.getPhotoURL() : "")
                .role("user")
                .verifie(false)
                .build();
    }

    public User toEntity(User user, UpdateProfileRequest request) {
        if (request.getNom() != null) {
            user.setNom(request.getNom());
        }
        if (request.getTelephone() != null) {
            user.setTelephone(request.getTelephone());
        }
        if (request.getPhotoURL() != null) {
            user.setPhotoURL(request.getPhotoURL());
        }
        if (request.getFcmToken() != null) {
            user.setFcmToken(request.getFcmToken());
        }
        if (request.getFavoris() != null) {
            user.setFavoris(request.getFavoris());
        }
        return user;
    }

    public UserResponse toResponse(User user) {
        if (user == null) return null;

        return UserResponse.builder()
                .uid(user.getUid())
                .nom(user.getNom())
                .email(user.getEmail())
                .telephone(user.getTelephone())
                .photoURL(user.getPhotoURL())
                .role(user.getRole())
                .favoris(user.getFavoris())
                .verifie(user.getVerifie())
                .isOrganisateur(user.isOrganisateur())
                .isAdmin(user.isAdmin())
                .isVerified(user.isVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    public List<UserResponse> toResponses(List<User> users) {
        return users.stream()
                .map(this::toResponse)
                .toList();
    }
}