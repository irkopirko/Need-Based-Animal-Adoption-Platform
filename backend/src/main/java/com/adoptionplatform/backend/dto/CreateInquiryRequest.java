package com.adoptionplatform.backend.dto;

public class CreateInquiryRequest {

    private Long adopterUserId;
    private Long animalId;
    private String message;

    public Long getAdopterUserId() {
        return adopterUserId;
    }

    public void setAdopterUserId(Long adopterUserId) {
        this.adopterUserId = adopterUserId;
    }

    public Long getAnimalId() {
        return animalId;
    }

    public void setAnimalId(Long animalId) {
        this.animalId = animalId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
