package com.eventhub.repository;

import com.eventhub.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, String>, JpaSpecificationExecutor<Event> {

    Page<Event> findByOrganisateurUid(String organisateurId, Pageable pageable);

    Page<Event> findByEstPublieTrue(Pageable pageable);

    Page<Event> findByStatut(String statut, Pageable pageable);

    Page<Event> findByCategorie(String categorie, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.estPublie = true AND e.statut = 'published' AND e.dateDebut > :now ORDER BY e.dateDebut ASC")
    Page<Event> findUpcomingEvents(@Param("now") LocalDateTime now, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.estPublie = true AND e.statut = 'published' AND e.dateFin < :now ORDER BY e.dateFin DESC")
    Page<Event> findPastEvents(@Param("now") LocalDateTime now, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.estPublie = true AND e.statut = 'published' AND " +
           "(LOWER(e.titre) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(e.lieu) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Event> searchEvents(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.estPublie = true AND e.statut = 'published' AND " +
           "(LOWER(e.titre) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(e.lieu) LIKE LOWER(CONCAT('%', :keyword, '%')) AND " +
           "e.dateDebut > :now)")
    Page<Event> searchUpcomingEvents(@Param("keyword") String keyword, @Param("now") LocalDateTime now, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.organisateur.uid = :organisateurId AND e.statut = 'draft'")
    List<Event> findDraftsByOrganisateur(@Param("organisateurId") String organisateurId);

    @Query("SELECT DISTINCT e.categorie FROM Event e WHERE e.categorie IS NOT NULL")
    List<String> findAllCategories();

    @Query("SELECT COUNT(e) FROM Event e WHERE e.organisateur.uid = :organisateurId")
    Long countByOrganisateur(@Param("organisateurId") String organisateurId);
}