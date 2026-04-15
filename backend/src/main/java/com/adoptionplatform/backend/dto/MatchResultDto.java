package com.adoptionplatform.backend.dto;

public class MatchResultDto {

    private Long animalId;
    private String name;
    private String animalType;
    private double matchPercentage;

    public MatchResultDto() {
    }

    public MatchResultDto(Long animalId, String name, String animalType, double matchPercentage) {
        this.animalId = animalId;
        this.name = name;
        this.animalType = animalType;
        this.matchPercentage = matchPercentage;
    }

    public Long getAnimalId() {
        return animalId;
    }

    public void setAnimalId(Long animalId) {
        this.animalId = animalId;
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

    public double getMatchPercentage() {
        return matchPercentage;
    }

    public void setMatchPercentage(double matchPercentage) {
        this.matchPercentage = matchPercentage;
    }
}