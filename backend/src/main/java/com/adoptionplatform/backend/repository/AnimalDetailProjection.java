package com.adoptionplatform.backend.repository;

import java.time.LocalDateTime;

/** Single-animal detail row (fields + image URLs, no eager entity graph). */
public interface AnimalDetailProjection {

    Long getId();

    Long getOwnerId();

    String getName();

    String getAnimalType();

    String getBreed();

    String getAgeGroup();

    String getSize();

    String getEnergyLevel();

    String getGroomingNeed();

    String getSpecialNeeds();

    String getGoodWithChildren();

    String getGoodWithPets();

    String getDescription();

    String getListingStatus();

    String getGender();

    String getHousingLocation();

    LocalDateTime getRegisterTime();

    Double getCompatibilityScore();

    String getImageUrlsPacked();
}
