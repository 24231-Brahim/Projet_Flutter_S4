package com.eventhub.repository;

import com.eventhub.entity.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, String> {

    List<Ticket> findByEventEventId(String eventId);

    Page<Ticket> findByEventEventId(String eventId, Pageable pageable);

    List<Ticket> findByEventEventIdAndActifTrue(String eventId);

    @Query("SELECT t FROM Ticket t WHERE t.event.eventId = :eventId AND t.actif = true AND t.quantiteDisponible > 0")
    List<Ticket> findAvailableByEvent(@Param("eventId") String eventId);

    @Modifying
    @Query("UPDATE Ticket t SET t.quantiteDisponible = t.quantiteDisponible - :quantity, t.quantiteVendue = t.quantiteVendue + :quantity WHERE t.ticketId = :ticketId AND t.quantiteDisponible >= :quantity")
    int decreaseStock(@Param("ticketId") String ticketId, @Param("quantity") int quantity);

    @Modifying
    @Query("UPDATE Ticket t SET t.quantiteDisponible = t.quantiteDisponible + :quantity, t.quantiteVendue = t.quantiteVendue - :quantity WHERE t.ticketId = :ticketId")
    int increaseStock(@Param("ticketId") String ticketId, @Param("quantity") int quantity);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.event.eventId = :eventId")
    Long countByEvent(@Param("eventId") String eventId);
}