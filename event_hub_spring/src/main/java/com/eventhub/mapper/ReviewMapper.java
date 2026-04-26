package com.eventhub.mapper;

import com.eventhub.dto.response.ReviewResponse;
import com.eventhub.dto.response.ReviewStatsResponse;
import com.eventhub.entity.Review;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ReviewMapper {

    public ReviewResponse toResponse(Review review) {
        if (review == null) return null;

        return ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .userId(review.getUser() != null ? review.getUser().getUid() : null)
                .eventId(review.getEvent() != null ? review.getEvent().getEventId() : null)
                .note(review.getNote())
                .commentaire(review.getCommentaire())
                .verifie(review.getVerifie())
                .createdAt(review.getCreatedAt())
                .userNom(review.getUserNom() != null ? review.getUserNom() : (review.getUser() != null ? review.getUser().getNom() : null))
                .userPhotoURL(review.getUserPhotoURL() != null ? review.getUserPhotoURL() : (review.getUser() != null ? review.getUser().getPhotoURL() : null))
                .build();
    }

    public List<ReviewResponse> toResponses(List<Review> reviews) {
        return reviews.stream()
                .map(this::toResponse)
                .toList();
    }

    public ReviewStatsResponse toStatsResponse(int totalReviews, Double averageRating, Object[] distribution) {
        Map<Integer, Integer> distributionMap = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            distributionMap.put(i, 0);
        }

        if (distribution != null) {
            for (Object row : distribution) {
                if (row instanceof Object[] arr && arr.length == 2) {
                    Integer rating = (Integer) arr[0];
                    Long count = (Long) arr[1];
                    distributionMap.put(rating, count.intValue());
                }
            }
        }

        return ReviewStatsResponse.builder()
                .totalReviews(totalReviews)
                .averageRating(averageRating != null ? averageRating : 0.0)
                .distribution(distributionMap)
                .build();
    }
}