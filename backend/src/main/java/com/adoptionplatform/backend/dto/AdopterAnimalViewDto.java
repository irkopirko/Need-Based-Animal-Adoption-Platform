package com.adoptionplatform.backend.dto;

import com.adoptionplatform.backend.entity.Animal;

import java.util.ArrayList;
import java.util.List;

/** Animal detail payload for adopters (listing + optional match score). */
public class AdopterAnimalViewDto {

    private Animal animal;
    private Double matchPercentage;
    private List<String> matchReasons = new ArrayList<>();

    public Animal getAnimal() {
        return animal;
    }

    public void setAnimal(Animal animal) {
        this.animal = animal;
    }

    public Double getMatchPercentage() {
        return matchPercentage;
    }

    public void setMatchPercentage(Double matchPercentage) {
        this.matchPercentage = matchPercentage;
    }

    public List<String> getMatchReasons() {
        return matchReasons;
    }

    public void setMatchReasons(List<String> matchReasons) {
        this.matchReasons = matchReasons != null ? matchReasons : new ArrayList<>();
    }
}
