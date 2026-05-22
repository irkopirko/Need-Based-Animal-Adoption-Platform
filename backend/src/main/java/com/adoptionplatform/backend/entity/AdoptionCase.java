package com.adoptionplatform.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Lifecycle for a specific adopter + animal pairing (proposed → accepted → reserved → completed).
 */
@Entity
@Table(name = "adoption_cases")
public class AdoptionCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long animalId;

    @Column(nullable = false)
    private Long adopterUserId;

    @Column(nullable = false)
    private Long ownerUserId;

    private Long inquiryId;

    private Long adoptionRequestId;

    private Double matchPercentageSnapshot;

    /** PROPOSED, ACCEPTED, RESERVED, COMPLETED, CANCELLED */
    @Column(nullable = false, length = 32)
    private String status = "PROPOSED";

    private LocalDateTime proposedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime reservedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
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

    public Long getAdopterUserId() {
        return adopterUserId;
    }

    public void setAdopterUserId(Long adopterUserId) {
        this.adopterUserId = adopterUserId;
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

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
