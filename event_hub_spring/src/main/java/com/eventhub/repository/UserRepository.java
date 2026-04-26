package com.eventhub.repository;

import com.eventhub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE LOWER(u.nom) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<User> searchUsers(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = :role")
    Page<User> findByRole(@Param("role") String role, Pageable pageable);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.events WHERE u.uid = :uid")
    Optional<User> findByIdWithEvents(@Param("uid") String uid);

    @Query("SELECT u FROM User LEFT JOIN FETCH u.bookings WHERE u.uid = :uid")
    Optional<User> findByIdWithBookings(@Param("uid") String uid);
}