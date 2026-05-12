package com.adoptionplatform.backend.service;

import com.adoptionplatform.backend.dto.MatchResultDto;
import com.adoptionplatform.backend.entity.AdoptionRequest;
import com.adoptionplatform.backend.entity.Animal;
import com.adoptionplatform.backend.repository.AdoptionRequestRepository;
import com.adoptionplatform.backend.repository.AnimalRepository;
import org.springframework.stereotype.Service;
import com.adoptionplatform.backend.repository.SavedAnimalRepository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class MatchService {

    private final AdoptionRequestRepository adoptionRequestRepository;
    private final AnimalRepository animalRepository;
    private final SavedAnimalRepository savedRepo;

    public MatchService(
            AdoptionRequestRepository adoptionRequestRepository,
            AnimalRepository animalRepository,
            SavedAnimalRepository savedAnimalRepository
    ) {
        this.adoptionRequestRepository = adoptionRequestRepository;
        this.animalRepository = animalRepository;
        this.savedRepo = savedAnimalRepository;
    }

    public List<MatchResultDto> getMatches(Long userId) {
        return getMatches(userId, null);
    }

    /**
     * Scores every animal against the adopter's adoption request. When {@code requestId} is null,
     * uses the latest {@code SUBMITTED} request if any, otherwise the latest request by time.
     */
    public List<MatchResultDto> getMatches(Long userId, Long requestId) {
        List<AdoptionRequest> requests = adoptionRequestRepository.findByUserId(userId);

        if (requests == null || requests.isEmpty()) {
            return new ArrayList<>();
        }

        AdoptionRequest latestRequest = selectRequestForMatching(requests, userId, requestId);
        if (latestRequest == null) {
            return new ArrayList<>();
        }

        List<Animal> animals = animalRepository.findAll();
        List<MatchResultDto> results = new ArrayList<>();

        for (Animal animal : animals) {
            ScoreResult scoreResult = calculateAdvancedScore(latestRequest, animal);

            MatchResultDto dto = new MatchResultDto(
                    animal.getId(),
                    animal.getName(),
                    animal.getAnimalType(),
                    animal.getBreed(),
                    animal.getSize(),
                    animal.getAgeGroup(),
                    animal.getEnergyLevel(),
                    animal.getHousingLocation(),
                    scoreResult.percentage,
                    scoreResult.reasons
            );

            dto.setCoverImageUrl(getCoverImageUrl(animal));
            dto.setHighlightTags(getHighlightTags(animal));
//dto.setAgeDisplay(getAgeDisplay(animal));
            dto.setSaved(savedRepo.existsByUserIdAndAnimalId(userId, animal.getId()));

            results.add(dto);
        }

        results.sort(Comparator.comparingDouble(MatchResultDto::getMatchPercentage).reversed());
        return results;
    }

    private AdoptionRequest selectRequestForMatching(List<AdoptionRequest> requests, Long userId, Long requestId) {
        if (requestId != null) {
            return requests.stream()
                    .filter(r -> Objects.equals(requestId, r.getId()) && Objects.equals(userId, r.getUserId()))
                    .findFirst()
                    .orElse(null);
        }
        Optional<AdoptionRequest> submitted = requests.stream()
                .filter(r -> "SUBMITTED".equalsIgnoreCase(String.valueOf(r.getRequestPhase())))
                .max(Comparator.comparing(
                        AdoptionRequest::getRequestTime,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ));
        if (submitted.isPresent()) {
            return submitted.get();
        }
        return requests.stream()
                .max(Comparator.comparing(
                        AdoptionRequest::getRequestTime,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .orElse(null);
    }

    private ScoreResult calculateAdvancedScore(AdoptionRequest request, Animal animal) {
        double score = 0;
        List<String> reasons = new ArrayList<>();

        score += animalTypeScore(request, animal, reasons);          // 18
        score += ageScore(request, animal, reasons);                 // 10
        score += sizeScore(request, animal, reasons);                // 10
        score += energyLifestyleScore(request, animal, reasons);     // 15
        score += homeEnvironmentScore(request, animal, reasons);     // 15
        score += childrenScore(request, animal, reasons);            // 10
        score += otherPetsScore(request, animal, reasons);           // 8
        score += groomingScore(request, animal, reasons);            // 5
        score += specialNeedsScore(request, animal, reasons);        // 6
        score += experienceScore(request, animal, reasons);          // 3

        double percentage = Math.max(0, Math.min(100, Math.round(score)));

        if (reasons.isEmpty()) {
            reasons.add("This animal has limited compatibility based on the current request.");
        }

        return new ScoreResult(percentage, reasons);
    }

    private double animalTypeScore(AdoptionRequest request, Animal animal, List<String> reasons) {
        if (contains(request.getPreferredAnimalTypes(), animal.getAnimalType())) {
            reasons.add("Animal type matches the adopter's preference.");
            return 18;
        }

        return 0;
    }

    private double ageScore(AdoptionRequest request, Animal animal, List<String> reasons) {
        String animalType = safe(animal.getAnimalType());
        String age = safe(animal.getAgeGroup());

        if (animalType.isEmpty() || age.isEmpty()) {
            return 0;
        }

        String expected = animalTypeTitle(animalType) + " - " + normalizeAgeForRequest(age);

        if (contains(request.getPreferredAgeRanges(), expected)) {
            reasons.add("Age range matches the adopter's preference.");
            return 10;
        }

        if (contains(request.getPreferredAgeRanges(), animalTypeTitle(animalType))) {
            return 5;
        }

        return 0;
    }

    private double sizeScore(AdoptionRequest request, Animal animal, List<String> reasons) {
        if (!isDog(animal)) {
            reasons.add("Size preference is less restrictive for cats.");
            return 8;
        }

        String expected = "Dog - " + title(safe(animal.getSize()));

        if (contains(request.getPreferredSizes(), expected) || contains(request.getPreferredSizes(), animal.getSize())) {
            reasons.add("Size matches the adopter's preference.");
            return 10;
        }

        if (isMedium(animal.getSize())) {
            return 5;
        }

        return 0;
    }

    private double energyLifestyleScore(AdoptionRequest request, Animal animal, List<String> reasons) {
        String preferredEnergy = safe(request.getPreferredEnergyLevels());
        String activity = safe(request.getActivityLevel());
        String timeAtHome = safe(request.getTimeAtHome());
        String workSchedule = safe(request.getWorkSchedule());
        String animalEnergy = safe(animal.getEnergyLevel());

        double points = 0;

        if (contains(preferredEnergy, animalEnergy)) {
            points += 6;
        }

        if (activity.equals("HIGH") && animalEnergy.equals("ACTIVE")) {
            points += 5;
        } else if (activity.equals("MEDIUM") && (animalEnergy.equals("BALANCED") || animalEnergy.equals("CALM"))) {
            points += 5;
        } else if (activity.equals("LOW") && animalEnergy.equals("CALM")) {
            points += 5;
        } else if (activity.equals("LOW") && animalEnergy.equals("ACTIVE")) {
            points -= 4;
        } else {
            points += 2;
        }

        if (animalEnergy.equals("ACTIVE")) {
            if (timeAtHome.contains("MOST OF THE DAY") || workSchedule.contains("REMOTE") || workSchedule.contains("FLEXIBLE")) {
                points += 4;
            } else if (workSchedule.contains("MOSTLY OUTSIDE")) {
                points -= 4;
            }
        } else {
            points += 2;
        }

        points = clamp(points, 0, 15);

        if (points >= 10) {
            reasons.add("Energy level fits the adopter's lifestyle and time availability.");
        }

        return points;
    }

    private double homeEnvironmentScore(AdoptionRequest request, Animal animal, List<String> reasons) {
        String indoorSpace = safe(request.getIndoorSpace());
        String livingSpace = safe(request.getLivingSpace());
        String hasGarden = safe(request.getHasGarden());
        String outdoorAccess = safe(request.getOutdoorAccess());
        String size = safe(animal.getSize());
        String energy = safe(animal.getEnergyLevel());

        double points = 0;

        if (livingSpace.contains("HOUSE") || livingSpace.contains("VILLA")) {
            points += 5;
        } else if (livingSpace.contains("APARTMENT") || livingSpace.contains("STUDIO")) {
            if (size.equals("SMALL") || size.equals("MEDIUM") || !isDog(animal)) {
                points += 4;
            } else {
                points -= 3;
            }
        }

        if (indoorSpace.contains("LARGE")) {
            points += 4;
        } else if (indoorSpace.contains("MEDIUM")) {
            points += 3;
        } else if (indoorSpace.contains("SMALL")) {
            if (size.equals("SMALL") || !isDog(animal)) {
                points += 3;
            } else if (energy.equals("ACTIVE")) {
                points -= 3;
            }
        }

        if (hasGarden.contains("YES")) {
            points += isDog(animal) ? 4 : 2;
        } else if (isDog(animal) && energy.equals("ACTIVE")) {
            points -= 3;
        }

        if (outdoorAccess.contains("PRIVATE YARD") || outdoorAccess.contains("TERRACE") || outdoorAccess.contains("SHARED OUTDOOR")) {
            points += 2;
        } else if (outdoorAccess.contains("NONE") && isDog(animal) && energy.equals("ACTIVE")) {
            points -= 3;
        }

        points = clamp(points, 0, 15);

        if (points >= 10) {
            reasons.add("Home environment is suitable for this animal.");
        }

        return points;
    }

    private double childrenScore(AdoptionRequest request, Animal animal, List<String> reasons) {
        String hasChildren = safe(request.getHasChildren());
        String goodWithChildren = safe(animal.getGoodWithChildren());

        if (hasChildren.contains("NO")) {
            return 10;
        }

        if (hasChildren.contains("YES") && goodWithChildren.equals("YES")) {
            reasons.add("Animal is suitable for a household with children.");
            return 10;
        }

        if (hasChildren.contains("YES") && goodWithChildren.equals("NO")) {
            return 0;
        }

        return 5;
    }

    private double otherPetsScore(AdoptionRequest request, Animal animal, List<String> reasons) {
        String hasOtherPets = safe(request.getHasOtherPets());
        String goodWithPets = safe(animal.getGoodWithPets());

        if (hasOtherPets.contains("NO")) {
            return 8;
        }

        if (hasOtherPets.contains("YES") && goodWithPets.equals("YES")) {
            reasons.add("Animal is compatible with homes that already have pets.");
            return 8;
        }

        if (hasOtherPets.contains("YES") && goodWithPets.equals("NO")) {
            return 0;
        }

        return 4;
    }

    private double groomingScore(AdoptionRequest request, Animal animal, List<String> reasons) {
        String animalType = animalTypeTitle(safe(animal.getAnimalType()));
        String groomingNeed = title(safe(animal.getGroomingNeed()));

        if (animalType.isEmpty() || groomingNeed.isEmpty()) {
            return 0;
        }

        String expected = animalType + " - " + groomingNeed + " Grooming";

        if (contains(request.getGroomingTolerance(), expected)) {
            reasons.add("Grooming needs match the adopter's tolerance.");
            return 5;
        }

        if (safe(animal.getGroomingNeed()).equals("LOW")) {
            return 3;
        }

        return 0;
    }

    private double specialNeedsScore(AdoptionRequest request, Animal animal, List<String> reasons) {
        String acceptance = safe(request.getSpecialNeedsAcceptance());
        String specialNeeds = safe(animal.getSpecialNeeds());

        if (specialNeeds.equals("NO")) {
            return 6;
        }

        if (specialNeeds.equals("YES") && acceptance.contains("YES")) {
            reasons.add("Adopter accepts animals with special needs.");
            return 6;
        }

        if (specialNeeds.equals("YES") && acceptance.contains("DEPENDS")) {
            return 3;
        }

        return 0;
    }

    private double experienceScore(AdoptionRequest request, Animal animal, List<String> reasons) {
        String hasExperience = safe(request.getHasPreviousExperience());
        String previousTypes = safe(request.getPreviousPetTypes());
        String animalType = safe(animal.getAnimalType());
        String specialNeeds = safe(animal.getSpecialNeeds());
        String grooming = safe(animal.getGroomingNeed());
        String energy = safe(animal.getEnergyLevel());

        boolean highCareAnimal =
                specialNeeds.equals("YES") ||
                        grooming.equals("HIGH") ||
                        energy.equals("ACTIVE");

        if (!highCareAnimal) {
            return 3;
        }

        if (hasExperience.contains("YES") && previousTypes.contains(animalType)) {
            reasons.add("Previous pet experience supports this match.");
            return 3;
        }

        if (hasExperience.contains("YES")) {
            return 2;
        }

        return 0;
    }

    private boolean contains(String source, String value) {
        if (source == null || value == null) return false;
        return source.toUpperCase().contains(value.toUpperCase());
    }

    private boolean isDog(Animal animal) {
        return safe(animal.getAnimalType()).equals("DOG");
    }

    private boolean isMedium(String value) {
        return safe(value).equals("MEDIUM");
    }

    private String safe(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }

    private String title(String value) {
        String clean = safe(value).toLowerCase();
        if (clean.isEmpty()) return "";
        return clean.substring(0, 1).toUpperCase() + clean.substring(1);
    }

    private String animalTypeTitle(String animalType) {
        if (animalType.equals("DOG")) return "Dog";
        if (animalType.equals("CAT")) return "Cat";
        return title(animalType);
    }

    private String normalizeAgeForRequest(String ageGroup) {
        String age = safe(ageGroup);

        if (age.equals("YOUNG") || age.equals("PUPPY") || age.equals("KITTEN")) {
            return "Puppy / Young";
        }

        if (age.equals("ADULT")) {
            return "Adult";
        }

        if (age.equals("SENIOR")) {
            return "Senior";
        }

        return title(ageGroup);
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private static class ScoreResult {
        private final double percentage;
        private final List<String> reasons;

        private ScoreResult(double percentage, List<String> reasons) {
            this.percentage = percentage;
            this.reasons = reasons;
        }
    }
    private String getCoverImageUrl(Animal animal) {
        if (animal.getImages() != null && !animal.getImages().isEmpty()) {
            return animal.getImages().get(0);
        }

        return null;
    }

    private String toDisplayText(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String clean = value.toLowerCase().replace("_", " ").trim();
        return clean.substring(0, 1).toUpperCase() + clean.substring(1);
    }
    private List<String> getHighlightTags(Animal animal) {
        List<String> tags = new ArrayList<>();

        if (animal.getEnergyLevel() != null && !animal.getEnergyLevel().isBlank()) {
            tags.add(toDisplayText(animal.getEnergyLevel()));
        }

        if (animal.getSize() != null && !animal.getSize().isBlank()) {
            tags.add(toDisplayText(animal.getSize()));
        }

        if ("YES".equalsIgnoreCase(animal.getGoodWithChildren())) {
            tags.add("Kid Friendly");
        }

        if ("YES".equalsIgnoreCase(animal.getGoodWithPets())) {
            tags.add("Pet Friendly");
        }

        if (animal.getHousingLocation() != null && !animal.getHousingLocation().isBlank()) {
            tags.add(toDisplayText(animal.getHousingLocation()));
        }

        if (animal.getGroomingNeed() != null && !animal.getGroomingNeed().isBlank()) {
            tags.add(toDisplayText(animal.getGroomingNeed()) + " Grooming");
        }

        if ("YES".equalsIgnoreCase(animal.getSpecialNeeds())) {
            tags.add("Special Needs");
        }

        return tags.size() > 2 ? tags.subList(0, 2) : tags;
    }
/*private String getAgeDisplay(Animal animal) {
    if (animal.getAge() != null) {
        return animal.getAge() + " years";
    }

    // fallback (ageGroup varsa)
    if (animal.getAgeGroup() != null) {
        String age = animal.getAgeGroup().toLowerCase();

        switch (age) {
            case "young":
            case "puppy":
            case "kitten":
                return "Under 1 year";
            case "adult":
                return "2-5 years";
            case "senior":
                return "6+ years";
        }
    }

    return "";
}*/
}