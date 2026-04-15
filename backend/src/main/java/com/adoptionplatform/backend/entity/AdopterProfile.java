package com.adoptionplatform.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "adopter_profiles")
public class AdopterProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    private String homeType;
    private String indoorSpace;
    private String preferredAnimalType;
    private String preferredSize;
    private String preferredAge;
    private String activityLevel;
    private Boolean hasChildren;
    private Boolean hasOtherPets;
    private String groomingTolerance;
    private Boolean specialNeedsTolerance;

    public AdopterProfile() {}

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getHomeType() {
        return homeType;
    }

    public void setHomeType(String homeType) {
        this.homeType = homeType;
    }

    public String getIndoorSpace() {
        return indoorSpace;
    }

    public void setIndoorSpace(String indoorSpace) {
        this.indoorSpace = indoorSpace;
    }

    public String getPreferredAnimalType() {
        return preferredAnimalType;
    }

    public void setPreferredAnimalType(String preferredAnimalType) {
        this.preferredAnimalType = preferredAnimalType;
    }

    public String getPreferredSize() {
        return preferredSize;
    }

    public void setPreferredSize(String preferredSize) {
        this.preferredSize = preferredSize;
    }

    public String getPreferredAge() {
        return preferredAge;
    }

    public void setPreferredAge(String preferredAge) {
        this.preferredAge = preferredAge;
    }

    public String getActivityLevel() {
        return activityLevel;
    }

    public void setActivityLevel(String activityLevel) {
        this.activityLevel = activityLevel;
    }

    public Boolean getHasChildren() {
        return hasChildren;
    }

    public void setHasChildren(Boolean hasChildren) {
        this.hasChildren = hasChildren;
    }

    public Boolean getHasOtherPets() {
        return hasOtherPets;
    }

    public void setHasOtherPets(Boolean hasOtherPets) {
        this.hasOtherPets = hasOtherPets;
    }

    public String getGroomingTolerance() {
        return groomingTolerance;
    }

    public void setGroomingTolerance(String groomingTolerance) {
        this.groomingTolerance = groomingTolerance;
    }

    public Boolean getSpecialNeedsTolerance() {
        return specialNeedsTolerance;
    }

    public void setSpecialNeedsTolerance(Boolean specialNeedsTolerance) {
        this.specialNeedsTolerance = specialNeedsTolerance;
    }
}