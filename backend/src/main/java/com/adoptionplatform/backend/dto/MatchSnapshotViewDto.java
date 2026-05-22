package com.adoptionplatform.backend.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class MatchSnapshotViewDto {

    private Long id;
    private Long adopterUserId;
    private String adopterName;
    private String adopterEmail;
    private Long animalId;
    private String animalName;
    private String listingCode;
    private Long adoptionRequestId;
    private Double matchPercentage;
    private List<String> matchReasons = new ArrayList<>();
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAdopterUserId() {
        return adopterUserId;
    }

    public void setAdopterUserId(Long adopterUserId) {
        this.adopterUserId = adopterUserId;
    }

    public String getAdopterName() {
        return adopterName;
    }

    public void setAdopterName(String adopterName) {
        this.adopterName = adopterName;
    }

    public String getAdopterEmail() {
        return adopterEmail;
    }

    public void setAdopterEmail(String adopterEmail) {
        this.adopterEmail = adopterEmail;
    }

    public Long getAnimalId() {
        return animalId;
    }

    public void setAnimalId(Long animalId) {
        this.animalId = animalId;
    }

    public String getAnimalName() {
        return animalName;
    }

    public void setAnimalName(String animalName) {
        this.animalName = animalName;
    }

    public String getListingCode() {
        return listingCode;
    }

    public void setListingCode(String listingCode) {
        this.listingCode = listingCode;
    }

    public Long getAdoptionRequestId() {
        return adoptionRequestId;
    }

    public void setAdoptionRequestId(Long adoptionRequestId) {
        this.adoptionRequestId = adoptionRequestId;
    }

    public Double getMatchPercentage() {
        return matchPercentage;
    }

    public void setMatchPercentage(Double matchPercentage) {
        this.matchPercentage = matchPercentage;
    }

    public List<String> getMatchReasons() {
        return matchReasons;
    }

    public void setMatchReasons(List<String> matchReasons) {
        this.matchReasons = matchReasons;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
