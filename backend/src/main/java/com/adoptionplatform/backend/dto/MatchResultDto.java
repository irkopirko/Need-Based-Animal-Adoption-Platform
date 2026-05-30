package com.adoptionplatform.backend.dto;

import java.util.List;

public class MatchResultDto {

    private Long animalId;
    private String name;
    private String animalType;
    private String breed;
    private String size;
    private String ageGroup;
    private String energyLevel;
    private String housingLocation;
    private String description;
    private String gender;
    private String groomingNeed;
    private String specialNeeds;
    private String goodWithChildren;
    private String goodWithPets;
    private double matchPercentage;
    private List<String> matchReasons;
    private String coverImageUrl;
    /** Image URLs from the persisted listing (same order as {@code animals} / images API). */
    private List<String> listingImageUrls;
    private List<String> highlightTags;
    private String ageDisplay;
    private boolean isSaved;


    public MatchResultDto() {
    }

    public MatchResultDto(
            Long animalId,
            String name,
            String animalType,
            String breed,
            String size,
            String ageGroup,
            String energyLevel,
            String housingLocation,
            double matchPercentage,
            List<String> matchReasons
    ) {
        this.animalId = animalId;
        this.name = name;
        this.animalType = animalType;
        this.breed = breed;
        this.size = size;
        this.ageGroup = ageGroup;
        this.energyLevel = energyLevel;
        this.housingLocation = housingLocation;
        this.matchPercentage = matchPercentage;
        this.matchReasons = matchReasons;
    }

    public Long getAnimalId() { return animalId; }
    public void setAnimalId(Long animalId) { this.animalId = animalId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAnimalType() { return animalType; }
    public void setAnimalType(String animalType) { this.animalType = animalType; }

    public String getBreed() { return breed; }
    public void setBreed(String breed) { this.breed = breed; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getAgeGroup() { return ageGroup; }
    public void setAgeGroup(String ageGroup) { this.ageGroup = ageGroup; }

    public String getEnergyLevel() { return energyLevel; }
    public void setEnergyLevel(String energyLevel) { this.energyLevel = energyLevel; }

    public String getHousingLocation() { return housingLocation; }
    public void setHousingLocation(String housingLocation) { this.housingLocation = housingLocation; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getGroomingNeed() { return groomingNeed; }
    public void setGroomingNeed(String groomingNeed) { this.groomingNeed = groomingNeed; }

    public String getSpecialNeeds() { return specialNeeds; }
    public void setSpecialNeeds(String specialNeeds) { this.specialNeeds = specialNeeds; }

    public String getGoodWithChildren() { return goodWithChildren; }
    public void setGoodWithChildren(String goodWithChildren) { this.goodWithChildren = goodWithChildren; }

    public String getGoodWithPets() { return goodWithPets; }
    public void setGoodWithPets(String goodWithPets) { this.goodWithPets = goodWithPets; }

    public double getMatchPercentage() { return matchPercentage; }
    public void setMatchPercentage(double matchPercentage) { this.matchPercentage = matchPercentage; }

    public List<String> getMatchReasons() { return matchReasons; }
    public void setMatchReasons(List<String> matchReasons) { this.matchReasons = matchReasons; }

    public String getCoverImageUrl() {
        return coverImageUrl;
    }

    public void setCoverImageUrl(String coverImageUrl) {
        this.coverImageUrl = coverImageUrl;
    }

    public List<String> getListingImageUrls() {
        return listingImageUrls;
    }

    public void setListingImageUrls(List<String> listingImageUrls) {
        this.listingImageUrls = listingImageUrls;
    }

    public List<String> getHighlightTags() {
        return highlightTags;
    }

    public void setHighlightTags(List<String> highlightTags) {
        this.highlightTags = highlightTags;

    }
    public String getAgeDisplay() {
        return ageDisplay;
    }

    public void setAgeDisplay(String ageDisplay) {
        this.ageDisplay = ageDisplay;
    }

    public boolean isSaved() {
        return isSaved;
    }

    public void setSaved(boolean saved) {
        isSaved = saved;
    }
}