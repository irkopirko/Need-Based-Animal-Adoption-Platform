package com.adoptionplatform.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "saved_animals",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_saved_animals_user_animal", columnNames = {"user_id", "animal_id"})
        })
public class SavedAnimal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "animal_id", nullable = false)
    private Long animalId;

    @Column(name = "adoption_request_id")
    private Long adoptionRequestId;

    private LocalDateTime savedAt;

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getAnimalId() {
        return animalId;
    }

    public void setAnimalId(Long animalId) {
        this.animalId = animalId;
    }

    public Long getAdoptionRequestId() {
        return adoptionRequestId;
    }

    public void setAdoptionRequestId(Long adoptionRequestId) {
        this.adoptionRequestId = adoptionRequestId;
    }

    public LocalDateTime getSavedAt() {
        return savedAt;
    }

    public void setSavedAt(LocalDateTime savedAt) {
        this.savedAt = savedAt;
    }
}