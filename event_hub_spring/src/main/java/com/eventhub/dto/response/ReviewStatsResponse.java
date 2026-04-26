package com.eventhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewStatsResponse {

    private int totalReviews;
    private double averageRating;
    private Map<Integer, Integer> distribution;
}