package com.eventhub.dto.response;

import java.util.Map;

public class ReviewStatsResponse {
    private int totalReviews;
    private double averageRating;
    private Map<Integer, Integer> distribution;

    public ReviewStatsResponse() {}

    public int getTotalReviews() { return totalReviews; }
    public void setTotalReviews(int totalReviews) { this.totalReviews = totalReviews; }
    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }
    public Map<Integer, Integer> getDistribution() { return distribution; }
    public void setDistribution(Map<Integer, Integer> distribution) { this.distribution = distribution; }
}