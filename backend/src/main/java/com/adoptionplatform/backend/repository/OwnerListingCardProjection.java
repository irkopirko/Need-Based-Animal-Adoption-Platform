package com.adoptionplatform.backend.repository;

import java.time.LocalDateTime;

/**
 * Lightweight owner listing row (one query, packed image URLs).
 */
public interface OwnerListingCardProjection {

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

    /** Image URLs joined with {@code \u001e}. */
    String getImageUrlsPacked();
}
