package com.eventhub.repository;

import com.eventhub.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {

    Page<Booking> findByUserUid(String userId, Pageable pageable);

    Page<Booking> findByEventEventId(String eventId, Pageable pageable);

    Page<Booking> findByUserUidAndStatut(String userId, String statut, Pageable pageable);

    @Query("SELECT b FROM Booking b WHERE b.user.uid = :userId AND b.event.eventId = :eventId AND b.statut != 'cancelled'")
    List<Booking> findActiveBookingsByUserAndEvent(@Param("userId") String userId, @Param("eventId") String eventId);

    Optional<Booking> findByQrCodeToken(String qrCodeToken);

    @Query("SELECT b FROM Booking b JOIN FETCH b.event JOIN FETCH b.ticket WHERE b.bookingId = :bookingId")
    Optional<Booking> findByIdWithDetails(@Param("bookingId") String bookingId);

    @Query("SELECT b FROM Booking b JOIN FETCH b.event JOIN FETCH b.ticket WHERE b.user.uid = :userId")
    Page<Booking> findByUserUidWithDetails(@Param("userId") String userId, Pageable pageable);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.event.eventId = :eventId AND b.statut = 'confirmed'")
    Long countConfirmedByEvent(@Param("eventId") String eventId);

    @Query("SELECT SUM(b.montantTotal) FROM Booking b WHERE b.event.organisateur.uid = :organisateurId AND b.statut = 'confirmed'")
    Double sumRevenueByOrganisateur(@Param("organisateurId") String organisateurId);

    @Query("SELECT b FROM Booking b WHERE b.event.eventId = :eventId AND b.scannedAt IS NOT NULL")
    List<Booking> findScannedByEvent(@Param("eventId") String eventId);

    @Query("SELECT b FROM Booking b WHERE b.dateReservation BETWEEN :startDate AND :endDate")
    Page<Booking> findBookingsBetweenDates(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, Pageable pageable);
}