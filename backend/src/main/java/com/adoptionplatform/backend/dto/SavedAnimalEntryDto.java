package com.adoptionplatform.backend.dto;

import com.adoptionplatform.backend.entity.Animal;
import java.time.LocalDateTime;

public class SavedAnimalEntryDto {

    private Long animalId;
    private Long adoptionRequestId;
    private LocalDateTime savedAt;
    private Animal animal;

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

    public Animal getAnimal() {
        return animal;
    }

    public void setAnimal(Animal animal) {
        this.animal = animal;
    }
}
