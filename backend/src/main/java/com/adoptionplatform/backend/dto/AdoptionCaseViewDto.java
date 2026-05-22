package com.adoptionplatform.backend.dto;

import java.time.LocalDateTime;

public class AdoptionCaseViewDto {

    private Long id;
    private Long animalId;
    private String animalName;
    private String listingCode;
    private Long adopterUserId;
    private String adopterName;
    private String adopterEmail;
    private Long ownerUserId;
    private Long inquiryId;
    private Long adoptionRequestId;
    private Double matchPercentageSnapshot;
    private String status;
    private LocalDateTime proposedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime reservedAt;
    private LocalDateTime completedAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Long getOwnerUserId() {
        return ownerUserId;
    }

    public void setOwnerUserId(Long ownerUserId) {
        this.ownerUserId = ownerUserId;
    }

    public Long getInquiryId() {
        return inquiryId;
    }

    public void setInquiryId(Long inquiryId) {
        this.inquiryId = inquiryId;
    }

    public Long getAdoptionRequestId() {
        return adoptionRequestId;
    }

    public void setAdoptionRequestId(Long adoptionRequestId) {
        this.adoptionRequestId = adoptionRequestId;
    }

    public Double getMatchPercentageSnapshot() {
        return matchPercentageSnapshot;
    }

    public void setMatchPercentageSnapshot(Double matchPercentageSnapshot) {
        this.matchPercentageSnapshot = matchPercentageSnapshot;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getProposedAt() {
        return proposedAt;
    }

    public void setProposedAt(LocalDateTime proposedAt) {
        this.proposedAt = proposedAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public LocalDateTime getReservedAt() {
        return reservedAt;
    }

    public void setReservedAt(LocalDateTime reservedAt) {
        this.reservedAt = reservedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
