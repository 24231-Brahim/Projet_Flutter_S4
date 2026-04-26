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
        ReviewResponse response = new ReviewResponse();
        response.setReviewId(review.getReviewId());
        response.setUserId(review.getUser() != null ? review.getUser().getUid() : null);
        response.setEventId(review.getEvent() != null ? review.getEvent().getEventId() : null);
        response.setNote(review.getNote());
        response.setCommentaire(review.getCommentaire());
        response.setVerifie(review.getVerifie());
        response.setCreatedAt(review.getCreatedAt());
        response.setUserNom(review.getUserNom() != null ? review.getUserNom() : (review.getUser() != null ? review.getUser().getNom() : null));
        response.setUserPhotoURL(review.getUserPhotoURL() != null ? review.getUserPhotoURL() : (review.getUser() != null ? review.getUser().getPhotoURL() : null));
        return response;
    }

    public List<ReviewResponse> toResponses(List<Review> reviews) {
        return reviews.stream().map(this::toResponse).toList();
    }

    public ReviewStatsResponse toStatsResponse(int totalReviews, Double averageRating, Object[] distribution) {
        Map<Integer, Integer> distributionMap = new HashMap<>();
        for (int i = 1; i <= 5; i++) distributionMap.put(i, 0);
        if (distribution != null) {
            for (Object row : distribution) {
                if (row instanceof Object[] arr && arr.length == 2) {
                    Integer rating = (Integer) arr[0];
                    Long count = (Long) arr[1];
                    distributionMap.put(rating, count.intValue());
                }
            }
        }
        ReviewStatsResponse response = new ReviewStatsResponse();
        response.setTotalReviews(totalReviews);
        response.setAverageRating(averageRating != null ? averageRating : 0.0);
        response.setDistribution(distributionMap);
        return response;
    }
}