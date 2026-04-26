package com.eventhub.repository;

import com.eventhub.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {

    Page<Review> findByEventEventId(String eventId, Pageable pageable);

    Page<Review> findByUserUid(String userId, Pageable pageable);

    Optional<Review> findByUserUidAndEventEventId(String userId, String eventId);

    boolean existsByUserUidAndEventEventId(String userId, String eventId);

    @Query("SELECT AVG(r.note) FROM Review r WHERE r.event.eventId = :eventId")
    Double calculateAverageRatingByEvent(@Param("eventId") String eventId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.event.eventId = :eventId")
    Long countByEvent(@Param("eventId") String eventId);

    @Query("SELECT r.note, COUNT(r) FROM Review r WHERE r.event.eventId = :eventId GROUP BY r.note")
    Object[] getRatingDistribution(@Param("eventId") String eventId);
}