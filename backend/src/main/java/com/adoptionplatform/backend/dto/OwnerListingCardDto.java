package com.adoptionplatform.backend.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class OwnerListingCardDto {

    private Long id;
    private Long ownerId;
    private String name;
    private String animalType;
    private String breed;
    private String ageGroup;
    private String size;
    private String energyLevel;
    private String groomingNeed;
    private String specialNeeds;
    private String goodWithChildren;
    private String goodWithPets;
    private String description;
    private String listingStatus;
    private String gender;
    private String housingLocation;
    private LocalDateTime registerTime;
    private List<String> images = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
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

    public String getAgeGroup() {
        return ageGroup;
    }

    public void setAgeGroup(String ageGroup) {
        this.ageGroup = ageGroup;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public String getEnergyLevel() {
        return energyLevel;
    }

    public void setEnergyLevel(String energyLevel) {
        this.energyLevel = energyLevel;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getListingStatus() {
        return listingStatus;
    }

    public void setListingStatus(String listingStatus) {
        this.listingStatus = listingStatus;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getHousingLocation() {
        return housingLocation;
    }

    public void setHousingLocation(String housingLocation) {
        this.housingLocation = housingLocation;
    }

    public LocalDateTime getRegisterTime() {
        return registerTime;
    }

    public void setRegisterTime(LocalDateTime registerTime) {
        this.registerTime = registerTime;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images != null ? images : new ArrayList<>();
    }
}
