package com.eventhub.controller;

import com.eventhub.dto.request.UpdateProfileRequest;
import com.eventhub.dto.response.ApiResponse;
import com.eventhub.dto.response.PageResponse;
import com.eventhub.dto.response.UserResponse;
import com.eventhub.security.service.CustomUserDetailsService;
import com.eventhub.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Gestion des utilisateurs")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;
    private final CustomUserDetailsService userDetailsService;

    @GetMapping("/me")
    @Operation(summary = "Profil actuel", description = "Récupérer le profil de l'utilisateur connecté")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String email = userDetails.getUsername();
        UserResponse response = userService.getUserByEmail(email);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me")
    @Operation(summary = "Modifier le profil", description = "Mettre à jour le profil de l'utilisateur connecté")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        String userId = userDetailsService.getCurrentUserId();
        UserResponse response = userService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Profil mis à jour", response));
    }

    @GetMapping("/{uid}")
    @Operation(summary = "Profil utilisateur", description = "Récupérer le profil d'un utilisateur par son ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @PathVariable String uid
    ) {
        UserResponse response = userService.getUserById(uid);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Liste des utilisateurs", description = "Récupérer une liste paginée d'utilisateurs")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAllUsers(
            @Parameter(description = "Numéro de page") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de page") @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PageResponse<UserResponse> response = userService.getAllUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/search")
    @Operation(summary = "Rechercher des utilisateurs", description = "Rechercher des utilisateurs par mot-clé")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> searchUsers(
            @Parameter(description = "Mot-clé de recherche") @RequestParam String keyword,
            @Parameter(description = "Numéro de page") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de page") @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PageResponse<UserResponse> response = userService.searchUsers(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}