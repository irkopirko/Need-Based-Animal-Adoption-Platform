package com.adoptionplatform.backend.repository;

import java.time.LocalDateTime;

public interface InquiryListProjection {
    Long getId();
    Long getAnimalId();
    String getAnimalName();
    String getAnimalImageUrl();
    Long getAdopterUserId();
    String getAdopterName();
    String getAdopterEmail();
    Long getOwnerUserId();
    String getStatus();
    String getInitialMessage();
    Long getAdoptionRequestId();
    Double getMatchPercentageAtContact();
    LocalDateTime getCreatedAt();
    LocalDateTime getUpdatedAt();
    Boolean getHasMessages();
}
