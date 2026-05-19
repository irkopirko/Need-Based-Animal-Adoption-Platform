package com.adoptionplatform.backend.entity;

import com.adoptionplatform.backend.util.ListingCodeUtil;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * row in {@code animals} primary key is {@link #id}
 * {@link #owner} references the listing owner ({@code users.id}) via {@code owner_id}; that value is not the animal PK
 */
@Entity
@Table(name = "animals")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Animal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(optional = false, fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(
            name = "owner_id",
            nullable = false,
            referencedColumnName = "id",
            foreignKey = @ForeignKey(name = "fk_animals_owner_user")
    )
    private User owner;

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
    private String housingLocation;

    @JsonIgnore
    @Fetch(FetchMode.SUBSELECT)
    @OneToMany(mappedBy = "animal", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<AnimalImage> animalImages = new ArrayList<>();

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

    /**
     * ordered image URLs persisted in {@code animal_images} (FK {@code animal_id} → {@link #id})
     */
    @JsonProperty("images")
    public List<String> getImages() {
        List<String> out = new ArrayList<>();
        if (animalImages == null || animalImages.isEmpty()) {
            return out;
        }
        List<AnimalImage> rows = new ArrayList<>(animalImages);
        rows.sort(Comparator.comparing(AnimalImage::getSortOrder, Comparator.nullsLast(Comparator.naturalOrder())));
        for (AnimalImage row : rows) {
            if (row.getImageUrl() != null && !row.getImageUrl().isBlank()) {
                out.add(row.getImageUrl());
            }
        }
        return out;
    }

    @JsonProperty("images")
    public void setImages(List<String> urls) {
        if (animalImages == null) {
            animalImages = new ArrayList<>();
        }
        animalImages.clear();
        if (urls == null) {
            return;
        }
        int order = 0;
        for (String raw : urls) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            AnimalImage row = new AnimalImage();
            row.setAnimal(this);
            row.setSortOrder(order);
            row.setImageUrl(raw.trim());
            animalImages.add(row);
            order++;
        }
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

    private LocalDateTime registerTime;

    public LocalDateTime getRegisterTime() {
        return registerTime;
    }

    public void setRegisterTime(LocalDateTime registerTime) {
        this.registerTime = registerTime;
    }

    @JsonIgnore
    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

    @JsonProperty("ownerId")
    public Long getOwnerId() {
        return owner == null ? null : owner.getId();
    }

    @JsonProperty("listingCode")
    public String getListingCode() {
        return ListingCodeUtil.format(id);
    }
}
