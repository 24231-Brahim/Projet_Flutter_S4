package com.eventhub.service;

import com.eventhub.dto.request.CreateReviewRequest;
import com.eventhub.dto.response.PageResponse;
import com.eventhub.dto.response.ReviewResponse;
import com.eventhub.dto.response.ReviewStatsResponse;
import com.eventhub.entity.Booking;
import com.eventhub.entity.Event;
import com.eventhub.entity.Review;
import com.eventhub.entity.User;
import com.eventhub.exception.*;
import com.eventhub.mapper.ReviewMapper;
import com.eventhub.repository.BookingRepository;
import com.eventhub.repository.EventRepository;
import com.eventhub.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;
    private final EventService eventService;
    private final UserService userService;
    private final ReviewMapper reviewMapper;

    @Transactional
    public ReviewResponse createReview(CreateReviewRequest request, String userId) {
        log.info("Creating review for event: {} by user: {}", request.getEventId(), userId);

        User user = userService.getUserEntity(userId);
        Event event = eventService.getEventEntity(request.getEventId());

        if (reviewRepository.existsByUserUidAndEventEventId(userId, request.getEventId())) {
            throw new InvalidRequestException("Vous avez déjà laissé un avis pour cet événement");
        }

        boolean hasBooked = !bookingRepository.findActiveBookingsByUserAndEvent(userId, request.getEventId()).isEmpty();
        if (!hasBooked) {
            throw new UnauthorizedException("Vous devez avoir assisté à cet événement pour laisser un avis");
        }

        Review review = Review.builder()
                .user(user)
                .event(event)
                .note(request.getNote())
                .commentaire(request.getCommentaire() != null ? request.getCommentaire() : "")
                .verifie(true)
                .build();

        review = reviewRepository.save(review);
        updateEventRating(event.getEventId());

        log.info("Review created: {}", review.getReviewId());
        return reviewMapper.toResponse(review);
    }

    @Transactional(readOnly = true)
    public ReviewResponse getReviewById(String reviewId) {
        Review review = findReviewById(reviewId);
        return reviewMapper.toResponse(review);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getReviewsByEvent(String eventId, Pageable pageable) {
        Page<Review> page = reviewRepository.findByEventEventId(eventId, pageable);
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getReviewsByUser(String userId, Pageable pageable) {
        Page<Review> page = reviewRepository.findByUserUid(userId, pageable);
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public ReviewStatsResponse getEventStats(String eventId) {
        Long totalReviews = reviewRepository.countByEvent(eventId);
        Double avgRating = reviewRepository.calculateAverageRatingByEvent(eventId);
        Object[] distribution = reviewRepository.getRatingDistribution(eventId);

        return reviewMapper.toStatsResponse(totalReviews != null ? totalReviews.intValue() : 0, avgRating, distribution);
    }

    @Transactional
    public void deleteReview(String reviewId, String userId) {
        log.info("Deleting review: {} by user: {}", reviewId, userId);

        Review review = findReviewById(reviewId);

        if (!review.getUser().getUid().equals(userId) && !userService.getUserById(userId).getIsAdmin()) {
            throw new UnauthorizedException("Vous ne pouvez pas supprimer cet avis");
        }

        reviewRepository.delete(review);
        updateEventRating(review.getEvent().getEventId());

        log.info("Review deleted: {}", reviewId);
    }

    private Review findReviewById(String reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Avis non trouvé"));
    }

    private void updateEventRating(String eventId) {
        Event event = eventService.getEventEntity(eventId);
        Double avgRating = reviewRepository.calculateAverageRatingByEvent(eventId);
        Long count = reviewRepository.countByEvent(eventId);

        event.setAverageRating(avgRating);
        event.setReviewCount(count != null ? count.intValue() : 0);
        eventRepository.save(event);
    }

    private PageResponse<ReviewResponse> toPageResponse(Page<Review> page) {
        return PageResponse.<ReviewResponse>builder()
                .content(reviewMapper.toResponses(page.getContent()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}