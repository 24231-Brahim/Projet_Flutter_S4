package com.eventhub.service;

import com.eventhub.dto.request.CreateReviewRequest;
import com.eventhub.dto.response.PageResponse;
import com.eventhub.dto.response.ReviewResponse;
import com.eventhub.dto.response.ReviewStatsResponse;
import com.eventhub.entity.Event;
import com.eventhub.entity.Review;
import com.eventhub.entity.User;
import com.eventhub.exception.*;
import com.eventhub.mapper.ReviewMapper;
import com.eventhub.repository.BookingRepository;
import com.eventhub.repository.EventRepository;
import com.eventhub.repository.ReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);

    private final ReviewRepository reviewRepository;
    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;
    private final EventService eventService;
    private final UserService userService;
    private final ReviewMapper reviewMapper;

    public ReviewService(ReviewRepository reviewRepository, EventRepository eventRepository,
                         BookingRepository bookingRepository, EventService eventService,
                         UserService userService, ReviewMapper reviewMapper) {
        this.reviewRepository = reviewRepository;
        this.eventRepository = eventRepository;
        this.bookingRepository = bookingRepository;
        this.eventService = eventService;
        this.userService = userService;
        this.reviewMapper = reviewMapper;
    }

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

        Review review = new Review();
        review.setUser(user);
        review.setEvent(event);
        review.setNote(request.getNote());
        review.setCommentaire(request.getCommentaire() != null ? request.getCommentaire() : "");
        review.setVerifie(true);

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
        PageResponse<ReviewResponse> response = new PageResponse<>();
        response.setContent(reviewMapper.toResponses(page.getContent()));
        response.setPage(page.getNumber());
        response.setSize(page.getSize());
        response.setTotalElements(page.getTotalElements());
        response.setTotalPages(page.getTotalPages());
        response.setFirst(page.isFirst());
        response.setLast(page.isLast());
        return response;
    }
}