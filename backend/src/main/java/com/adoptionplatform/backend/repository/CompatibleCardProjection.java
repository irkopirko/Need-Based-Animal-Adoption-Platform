package com.adoptionplatform.backend.repository;

/**
 * Native-query projection for adopter compatible listing (one row per strong match).
 */
public interface CompatibleCardProjection {

    Long getAnimalId();

    String getName();

    String getAnimalType();

    String getBreed();

    String getAgeGroup();

    String getSize();

    String getEnergyLevel();

    String getHousingLocation();

    String getGender();

    String getGroomingNeed();

    String getSpecialNeeds();

    String getGoodWithChildren();

    String getGoodWithPets();

    String getDescription();

    Double getMatchPercentage();

    String getMatchReasonsJson();

    String getCoverImageUrl();

    Integer getSavedFlag();
}
