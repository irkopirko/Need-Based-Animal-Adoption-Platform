package com.adoptionplatform.backend.dto;

public class AnimalRequest {

    private String name;
    private String animalType;
    private String breed;
    private String size;
    private String ageGroup;
    private String energyLevel;
    private String goodWithChildren;
    private String goodWithPets;
    private String groomingNeed;
    private String specialNeeds;
    private String description;

    public AnimalRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAnimalType() {
        return animalType;
    }

    public void setAnimalType(String animalType) {
        this.animalType = animalType;
    }

    public String getBreed() {
        return breed;
    }

    public void setBreed(String breed) {
        this.breed = breed;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public String getAgeGroup() {
        return ageGroup;
    }

    public void setAgeGroup(String ageGroup) {
        this.ageGroup = ageGroup;
    }

    public String getEnergyLevel() {
        return energyLevel;
    }

    public void setEnergyLevel(String energyLevel) {
        this.energyLevel = energyLevel;
    }

    public String getGoodWithChildren() {
        return goodWithChildren;
    }

    public void setGoodWithChildren(String goodWithChildren) {
        this.goodWithChildren = goodWithChildren;
    }

    public String getGoodWithPets() {
        return goodWithPets;
    }

    public void setGoodWithPets(String goodWithPets) {
        this.goodWithPets = goodWithPets;
    }

    public String getGroomingNeed() {
        return groomingNeed;
    }

    public void setGroomingNeed(String groomingNeed) {
        this.groomingNeed = groomingNeed;
    }

    public String getSpecialNeeds() {
        return specialNeeds;
    }

    public void setSpecialNeeds(String specialNeeds) {
        this.specialNeeds = specialNeeds;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}