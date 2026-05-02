package com.adoptionplatform.backend.entity;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "animals")
public class Animal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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
    private Double compatibilityScore;
    private String housingLocation; //home or shelter??

    @ElementCollection
    @CollectionTable(name = "animal_images", joinColumns = @JoinColumn(name = "animal_id"))
    @Column(name = "image_url")
    private List<String> images=new ArrayList<>();

    public Animal() {
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getAnimalType() {
        return animalType;
    }

    public String getBreed() {
        return breed;
    }

    public String getAgeGroup() {
        return ageGroup;
    }

    public String getSize() {
        return size;
    }

    public String getEnergyLevel() {
        return energyLevel;
    }

    public String getGroomingNeed() {
        return groomingNeed;
    }

    public String getSpecialNeeds() {
        return specialNeeds;
    }

    public String getGoodWithChildren() {
        return goodWithChildren;
    }

    public String getGoodWithPets() {
        return goodWithPets;
    }

    public String getDescription() {
        return description;
    }

    public String getListingStatus() {
        return listingStatus;
    }

    public Double getCompatibilityScore() {
        return compatibilityScore;
    }

    public List<String> getImages() {
        return images;
    }

    public String getHousingLocation() {
    return housingLocation;
}

public void setHousingLocation(String housingLocation) {
    this.housingLocation = housingLocation;
}

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setAnimalType(String animalType) {
        this.animalType = animalType;
    }

    public void setBreed(String breed) {
        this.breed = breed;
    }

    public void setAgeGroup(String ageGroup) {
        this.ageGroup = ageGroup;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public void setEnergyLevel(String energyLevel) {
        this.energyLevel = energyLevel;
    }

    public void setGroomingNeed(String groomingNeed) {
        this.groomingNeed = groomingNeed;
    }

    public void setSpecialNeeds(String specialNeeds) {
        this.specialNeeds = specialNeeds;
    }

    public void setGoodWithChildren(String goodWithChildren) {
        this.goodWithChildren = goodWithChildren;
    }

    public void setGoodWithPets(String goodWithPets) {
        this.goodWithPets = goodWithPets;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setListingStatus(String listingStatus) {
        this.listingStatus = listingStatus;
    }

    public void setCompatibilityScore(Double compatibilityScore) {
        this.compatibilityScore = compatibilityScore;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }
    private LocalDateTime registerTime;
public LocalDateTime getRegisterTime() {
    return registerTime;
}

public void setRegisterTime(LocalDateTime registerTime) {
    this.registerTime = registerTime;
}


}