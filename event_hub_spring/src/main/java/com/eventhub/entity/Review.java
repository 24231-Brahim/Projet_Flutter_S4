package com.eventhub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_uid", "event_id"})
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "review_id", updatable = false, nullable = false)
    private String reviewId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private Integer note;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @Column(nullable = false)
    @Builder.Default
    private Boolean verifie = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Transient fields for populated data
    @Transient
    private String userNom;

    @Transient
    private String userPhotoURL;
}