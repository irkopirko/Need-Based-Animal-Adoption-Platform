package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.MatchResultDto;
import com.adoptionplatform.backend.entity.AdopterProfile;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.repository.AdopterProfileRepository;
import com.adoptionplatform.backend.repository.AnimalRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class MatchService {

    private final AdopterProfileRepository adopterProfileRepository;
    private final AnimalRepository animalRepository;

    public MatchService(AdopterProfileRepository adopterProfileRepository,
                        AnimalRepository animalRepository) {
        this.adopterProfileRepository = adopterProfileRepository;
        this.animalRepository = animalRepository;
    }

    public List<MatchResultDto> getMatches(Long userId) {
        AdopterProfile profile = adopterProfileRepository.findByUserId(userId).orElse(null);

        if (profile == null) {
            return new ArrayList<>();
        }

        List<Animal> animals = animalRepository.findAll();
        List<MatchResultDto> results = new ArrayList<>();

        for (Animal animal : animals) {
            double score = calculateScore(profile, animal);

            results.add(new MatchResultDto(
                    animal.getId(),
                    animal.getName(),
                    animal.getAnimalType(),
                    score
            ));
        }

        results.sort(Comparator.comparingDouble(MatchResultDto::getMatchPercentage).reversed());
        return results;
    }

    private double calculateScore(AdopterProfile profile, Animal animal) {
        double score = 0.0;

        if (equalsIgnoreCase(profile.getPreferredAnimalType(), animal.getAnimalType())) {
            score += 30;
        }

        if (equalsIgnoreCase(profile.getPreferredSize(), animal.getSize())) {
            score += 20;
        }

        if (equalsIgnoreCase(profile.getPreferredAge(), animal.getAgeGroup())) {
            score += 15;
        }

        if (activityMatches(profile.getActivityLevel(), animal.getEnergyLevel())) {
            score += 20;
        }

        if (homeMatches(profile.getHomeType(), animal.getSize(), animal.getEnergyLevel())) {
            score += 10;
        }

        if (specialNeedsMatches(profile.getSpecialNeedsTolerance(), animal.getSpecialNeeds())) {
            score += 5;
        }

        return score;
    }

    private boolean equalsIgnoreCase(String a, String b) {
        if (a == null || b == null) return false;
        return a.equalsIgnoreCase(b);
    }

    private boolean activityMatches(String activityLevel, String energyLevel) {
        if (activityLevel == null || energyLevel == null) return false;

        if (activityLevel.equalsIgnoreCase("LOW") && energyLevel.equalsIgnoreCase("LOW")) return true;
        if (activityLevel.equalsIgnoreCase("MEDIUM") && energyLevel.equalsIgnoreCase("MEDIUM")) return true;
        if (activityLevel.equalsIgnoreCase("HIGH") && energyLevel.equalsIgnoreCase("HIGH")) return true;

        if (activityLevel.equalsIgnoreCase("MEDIUM") && energyLevel.equalsIgnoreCase("LOW")) return true;
        if (activityLevel.equalsIgnoreCase("HIGH") && energyLevel.equalsIgnoreCase("MEDIUM")) return true;

        return false;
    }

    private boolean homeMatches(String homeType, String animalSize, String energyLevel) {
        if (homeType == null || animalSize == null) return false;

        if (homeType.equalsIgnoreCase("APARTMENT")) {
            return !animalSize.equalsIgnoreCase("LARGE");
        }

        if (homeType.equalsIgnoreCase("HOUSE")) {
            return true;
        }

        return energyLevel != null && !energyLevel.equalsIgnoreCase("HIGH");
    }

    private boolean specialNeedsMatches(Boolean tolerance, String specialNeeds) {
        if (tolerance == null || specialNeeds == null) return false;

        if (Boolean.TRUE.equals(tolerance)) {
            return true;
        }

        return !specialNeeds.equalsIgnoreCase("YES");
    }
}