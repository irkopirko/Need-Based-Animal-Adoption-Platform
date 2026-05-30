package com.adoptionplatform.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class AnimalMatchScoreDto {

    private Long animalId;
    private double matchPercentage;
    private List<String> matchReasons = new ArrayList<>();

    public Long getAnimalId() {
        return animalId;
    }

    public void setAnimalId(Long animalId) {
        this.animalId = animalId;
    }

    public double getMatchPercentage() {
        return matchPercentage;
    }

    public void setMatchPercentage(double matchPercentage) {
        this.matchPercentage = matchPercentage;
    }

    public List<String> getMatchReasons() {
        return matchReasons;
    }

    public void setMatchReasons(List<String> matchReasons) {
        this.matchReasons = matchReasons != null ? matchReasons : new ArrayList<>();
    }
}
