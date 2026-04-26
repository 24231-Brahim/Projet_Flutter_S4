package com.eventhub.repository;

import com.eventhub.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    Page<Notification> findByUserUidOrderByEnvoyeAtDesc(String userId, Pageable pageable);

    Page<Notification> findByUserUidAndLueFalseOrderByEnvoyeAtDesc(String userId, Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.uid = :userId AND n.lue = false")
    Long countUnreadByUser(@Param("userId") String userId);

    @Modifying
    @Query("UPDATE Notification n SET n.lue = true WHERE n.user.uid = :userId")
    int markAllAsRead(@Param("userId") String userId);

    @Modifying
    @Query("UPDATE Notification n SET n.lue = true WHERE n.notifId = :notifId")
    int markAsRead(@Param("notifId") String notifId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.user.uid = :userId")
    int deleteAllByUser(@Param("userId") String userId);

    @Query("SELECT n FROM Notification n WHERE n.user.uid = :userId AND n.envoyeAt >= :since")
    Page<Notification> findRecentByUser(@Param("userId") String userId, @Param("since") LocalDateTime since, Pageable pageable);
}