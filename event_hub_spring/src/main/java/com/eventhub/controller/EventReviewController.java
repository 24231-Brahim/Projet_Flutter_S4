package com.eventhub.controller;

import com.eventhub.dto.request.CreateReviewRequest;
import com.eventhub.dto.response.ApiResponse;
import com.eventhub.dto.response.PageResponse;
import com.eventhub.dto.response.ReviewResponse;
import com.eventhub.dto.response.ReviewStatsResponse;
import com.eventhub.security.service.CustomUserDetailsService;
import com.eventhub.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/events/{eventId}/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Gestion des avis")
public class EventReviewController {

    private final ReviewService reviewService;
    private final CustomUserDetailsService userDetailsService;

    @GetMapping
    @Operation(summary = "Avis d'un événement", description = "Récupérer les avis d'un événement")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getEventReviews(
            @PathVariable String eventId,
            @Parameter(description = "Numéro de page") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de page") @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PageResponse<ReviewResponse> response = reviewService.getReviewsByEvent(eventId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/stats")
    @Operation(summary = "Statistiques des avis", description = "Récupérer les statistiques des avis d'un événement")
    public ResponseEntity<ApiResponse<ReviewStatsResponse>> getEventReviewStats(
            @PathVariable String eventId
    ) {
        ReviewStatsResponse response = reviewService.getEventStats(eventId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Créer un avis", description = "Laisser un avis pour un événement")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        String userId = userDetailsService.getCurrentUserId();
        request.setEventId(eventId);
        ReviewResponse response = reviewService.createReview(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Avis créé", response));
    }

    @DeleteMapping("/{reviewId}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Supprimer un avis", description = "Supprimer son propre avis")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable String eventId,
            @PathVariable String reviewId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String userId = userDetailsService.getCurrentUserId();
        reviewService.deleteReview(reviewId, userId);
        return ResponseEntity.ok(ApiResponse.success("Avis supprimé", null));
    }
}