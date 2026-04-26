package com.eventhub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "uid", updatable = false, nullable = false)
    private String uid;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "telephone")
    private String telephone;

    @Column(name = "photo_url")
    private String photoURL;

    @Column(nullable = false)
    @Builder.Default
    private String role = "user";

    @ElementCollection
    @CollectionTable(name = "user_favorites", joinColumns = @JoinColumn(name = "user_uid"))
    @Column(name = "event_id")
    @Builder.Default
    private List<String> favoris = new ArrayList<>();

    @Column(name = "fcm_token")
    private String fcmToken;

    @Column(nullable = false)
    @Builder.Default
    private Boolean verifie = false;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Booking> bookings = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Event> events = new ArrayList<>();

    // Transient getters for Flutter model compatibility
    public boolean isOrganisateur() {
        return "organisateur".equals(role) || "admin".equals(role);
    }

    public boolean isAdmin() {
        return "admin".equals(role);
    }

    public boolean isVerified() {
        return verifie != null && verifie;
    }
}