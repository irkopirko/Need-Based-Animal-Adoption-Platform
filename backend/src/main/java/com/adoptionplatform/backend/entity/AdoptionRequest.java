package com.adoptionplatform.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "adoption_requests")
public class AdoptionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String indoorSpace;
    private String livingSpace;
    private String livingSpaceOther;
    private String housingStatus;
    private String hasGarden;
    private String outdoorAccess;

    private String activityLevel;
    private String workSchedule;
    private String timeAtHome;

    private String householdType;
    private String hasChildren;

    @Column(length = 1000)
    private String childrenAgeGroup;

    private String hasOtherPets;

    @Column(length = 1000)
    private String otherPetsType;

    private String otherPetsTypeOther;

    private String primaryCaretaker;
    private String primaryCaretakerOther;
    private String hasPreviousExperience;

    @Column(length = 1000)
    private String previousPetTypes;

    private String previousPetTypesOther;

    @Column(length = 1000)
    private String preferredAnimalTypes;

    @Column(length = 1000)
    private String preferredEnergyLevels;

    @Column(length = 1000)
    private String preferredAgeRanges;

    @Column(length = 1000)
    private String preferredSizes;

    @Column(length = 1000)
    private String groomingTolerance;

    private String specialNeedsAcceptance;

    @Column(length = 2000)
    private String notes;

//getter setter

public Long getId() { return id; }
public void setId(Long id) { this.id = id; }

public Long getUserId() { return userId; }
public void setUserId(Long userId) { this.userId = userId; }

public String getIndoorSpace() { return indoorSpace; }
public void setIndoorSpace(String indoorSpace) { this.indoorSpace = indoorSpace; }

public String getLivingSpace() { return livingSpace; }
public void setLivingSpace(String livingSpace) { this.livingSpace = livingSpace; }

public String getLivingSpaceOther() { return livingSpaceOther; }
public void setLivingSpaceOther(String livingSpaceOther) { this.livingSpaceOther = livingSpaceOther; }

public String getHousingStatus() { return housingStatus; }
public void setHousingStatus(String housingStatus) { this.housingStatus = housingStatus; }

public String getHasGarden() { return hasGarden; }
public void setHasGarden(String hasGarden) { this.hasGarden = hasGarden; }

public String getOutdoorAccess() { return outdoorAccess; }
public void setOutdoorAccess(String outdoorAccess) { this.outdoorAccess = outdoorAccess; }

public String getActivityLevel() { return activityLevel; }
public void setActivityLevel(String activityLevel) { this.activityLevel = activityLevel; }

public String getWorkSchedule() { return workSchedule; }
public void setWorkSchedule(String workSchedule) { this.workSchedule = workSchedule; }

public String getTimeAtHome() { return timeAtHome; }
public void setTimeAtHome(String timeAtHome) { this.timeAtHome = timeAtHome; }

public String getHouseholdType() { return householdType; }
public void setHouseholdType(String householdType) { this.householdType = householdType; }

public String getHasChildren() { return hasChildren; }
public void setHasChildren(String hasChildren) { this.hasChildren = hasChildren; }

public String getChildrenAgeGroup() { return childrenAgeGroup; }
public void setChildrenAgeGroup(String childrenAgeGroup) { this.childrenAgeGroup = childrenAgeGroup; }

public String getHasOtherPets() { return hasOtherPets; }
public void setHasOtherPets(String hasOtherPets) { this.hasOtherPets = hasOtherPets; }

public String getOtherPetsType() { return otherPetsType; }
public void setOtherPetsType(String otherPetsType) { this.otherPetsType = otherPetsType; }

public String getOtherPetsTypeOther() { return otherPetsTypeOther; }
public void setOtherPetsTypeOther(String otherPetsTypeOther) { this.otherPetsTypeOther = otherPetsTypeOther; }

public String getPrimaryCaretaker() { return primaryCaretaker; }
public void setPrimaryCaretaker(String primaryCaretaker) { this.primaryCaretaker = primaryCaretaker; }

public String getPrimaryCaretakerOther() { return primaryCaretakerOther; }
public void setPrimaryCaretakerOther(String primaryCaretakerOther) { this.primaryCaretakerOther = primaryCaretakerOther; }

public String getHasPreviousExperience() { return hasPreviousExperience; }
public void setHasPreviousExperience(String hasPreviousExperience) { this.hasPreviousExperience = hasPreviousExperience; }

public String getPreviousPetTypes() { return previousPetTypes; }
public void setPreviousPetTypes(String previousPetTypes) { this.previousPetTypes = previousPetTypes; }

public String getPreviousPetTypesOther() { return previousPetTypesOther; }
public void setPreviousPetTypesOther(String previousPetTypesOther) { this.previousPetTypesOther = previousPetTypesOther; }

public String getPreferredAnimalTypes() { return preferredAnimalTypes; }
public void setPreferredAnimalTypes(String preferredAnimalTypes) { this.preferredAnimalTypes = preferredAnimalTypes; }

public String getPreferredEnergyLevels() { return preferredEnergyLevels; }
public void setPreferredEnergyLevels(String preferredEnergyLevels) { this.preferredEnergyLevels = preferredEnergyLevels; }

public String getPreferredAgeRanges() { return preferredAgeRanges; }
public void setPreferredAgeRanges(String preferredAgeRanges) { this.preferredAgeRanges = preferredAgeRanges; }

public String getPreferredSizes() { return preferredSizes; }
public void setPreferredSizes(String preferredSizes) { this.preferredSizes = preferredSizes; }

public String getGroomingTolerance() { return groomingTolerance; }
public void setGroomingTolerance(String groomingTolerance) { this.groomingTolerance = groomingTolerance; }

public String getSpecialNeedsAcceptance() { return specialNeedsAcceptance; }
public void setSpecialNeedsAcceptance(String specialNeedsAcceptance) { this.specialNeedsAcceptance = specialNeedsAcceptance; }

public String getNotes() { return notes; }
public void setNotes(String notes) { this.notes = notes; }

private LocalDateTime requestTime;

public LocalDateTime getRequestTime() {
    return requestTime;
}

public void setRequestTime(LocalDateTime requestTime) {
    this.requestTime = requestTime;
}

}